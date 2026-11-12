using System.Data;
using AlooGiyah_Application.DTOs.Wallet;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Shared.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Application.Services.Store;

public class SettlementService(
    IGenericRepository<SellerReceivable> incomes,
    IGenericRepository<SettlementRequest> requests,
    IGenericRepository<SettlementCalendarDay> calendar,
    IGenericRepository<SettlementRates> rates,
    ICurrentUserService user, IUnitOfWork unit)
{
    public bool CanManage => user.Roles.Any(x => x is "Manager" or "Admin");
    public async Task<SettlementRatesDto> Rates()
    {
        UserId();
        var latest = await rates.GetAll().OrderByDescending(x => x.SettlementRatesId).FirstOrDefaultAsync();
        return new(latest?.CommissionRate ?? 0, latest?.TaxRate ?? 0, latest?.Reason ?? "نرخ اولیه صفر درصد");
    }
    public async Task SetRates(SettlementRatesDto dto)
    {
        var id = UserId();
        if (!user.Roles.Contains("Manager")) throw new ForbiddenException("تغییر نرخ‌ها فقط برای مدیر ارشد (Manager) مجاز است.");
        if (dto.CommissionRate < 0 || dto.TaxRate < 0 || dto.CommissionRate + dto.TaxRate > 100 ||
            decimal.Round(dto.CommissionRate, 4) != dto.CommissionRate || decimal.Round(dto.TaxRate, 4) != dto.TaxRate ||
            string.IsNullOrWhiteSpace(dto.Reason) || dto.Reason.Length > 1000)
            throw new BadRequestException("نرخ‌ها باید نامنفی و مجموع حداکثر ۱۰۰ درصد باشند؛ دلیل تغییر نیز الزامی است.");
        await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        await rates.AddAsync(new() { CommissionRate = dto.CommissionRate, TaxRate = dto.TaxRate, Reason = dto.Reason.Trim(), ChangedById = id });
        await unit.SaveChangesAsync(); await tx.CommitAsync();
    }
    private int UserId()
    {
        if (!user.IsAuthenticated || user.IsGuest || !int.TryParse(user.UserId, out var id))
            throw new UnauthorizedException("ابتدا وارد حساب شوید.");
        return id;
    }
    private void RequireManager()
    {
        UserId();
        if (!CanManage) throw new ForbiddenException("فقط مدیریت مجاز است.");
    }
    private static SettlementDto Map(SettlementRequest r, bool manager = false) => new(r.Code, r.Amount,
        manager ? r.Iban : r.Iban[..4] + new string('*', 18) + r.Iban[^4..], r.AccountHolder, r.Status,
        r.CreatedAt, r.ScheduledDate, r.CycleSaturday, r.CutoffAt, r.TransferReference, r.PaidAt,
        r.History.OrderBy(x => x.CreatedAt).Select(x => new SettlementHistoryDto(x.Action, x.Note, x.CreatedAt)).ToList(),
        r.TransferAttempts.OrderBy(x => x.CreatedAt).Select(x => new SettlementAttemptDto(x.Code, x.Provider,
            x.Status, x.AmountToman, x.ProviderReference, x.CreatedAt, x.CompletedAt, x.ResolutionNote)).ToList());

    private async Task<DateOnly> PaymentDay(DateOnly saturday)
    {
        var end = saturday.AddDays(365);
        var days = await calendar.GetAll().Where(x => x.Date >= saturday && x.Date <= end)
            .ToDictionaryAsync(x => x.Date, x => x.IsClosed);
        return SettlementPolicy.PaymentDay(saturday, days);
    }
    private async Task<decimal> Available(int id)
    {
        var released = await incomes.GetAll().Where(x => x.SellerId == id)
            .SumAsync(x => (decimal?)x.ReleasedAmount) ?? 0;
        var committed = await requests.GetAll().Where(x => x.SellerId == id && x.Status != "Rejected" && x.Status != "Cancelled")
            .SumAsync(x => (decimal?)x.Amount) ?? 0;
        return released - committed;
    }
    public async Task<SettlementSummaryDto> Summary()
    {
        var id = UserId();
        // A consistent snapshot prevents mixed totals while another transaction reserves income.
        await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var reserved = await incomes.GetAll().Where(x => x.SellerId == id)
            .SumAsync(x => (decimal?)(x.NetAmount - x.ReleasedAmount)) ?? 0;
        var pending = await requests.GetAll().Where(x => x.SellerId == id && x.Status != "Paid" && x.Status != "Rejected" && x.Status != "Cancelled")
            .SumAsync(x => (decimal?)x.Amount) ?? 0;
        var paid = await requests.GetAll().Where(x => x.SellerId == id && x.Status == "Paid")
            .SumAsync(x => (decimal?)x.Amount) ?? 0;
        var available = await Available(id);
        DateOnly? next = null;
        string? warning = null;
        try { next = await PaymentDay(SettlementPolicy.Cycle(DateTimeOffset.UtcNow).Saturday); }
        catch (ConflictException e) { warning = e.Message; }
        await tx.CommitAsync();
        var currentRates = await Rates();
        return new(reserved, available, pending, paid, currentRates.CommissionRate, currentRates.TaxRate, CanManage, next, warning);
    }
    public async Task<SettlementPageDto<SellerIncomeDto>> Income(int page = 1)
    {
        var id = UserId(); page = Math.Max(page, 1);
        var q = incomes.GetAll().AsNoTracking().Where(x => x.SellerId == id);
        var count = await q.CountAsync();
        var items = await q.OrderByDescending(x => x.CreatedAt).Skip((page - 1) * 20).Take(20)
            .Select(x => new SellerIncomeDto(x.Order.Code, x.GrossAmount, x.CommissionRate, x.CommissionAmount,
                x.TaxRate, x.TaxAmount, x.NetAmount, x.ReleasedAmount, x.ReleasedAt, x.PlatformDiscountAmount, x.SellerDiscountAmount)).ToListAsync();
        return new(items, count, page, 20);
    }
    public async Task<SettlementPageDto<SettlementDto>> List(bool manage, string? status, int page = 1)
    {
        var id = UserId();
        if (manage) RequireManager();
        page = Math.Max(page, 1);
        var q = requests.GetAll().AsNoTracking().Where(x => manage || x.SellerId == id);
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(x => x.Status == status);
        var count = await q.CountAsync();
        var items = await q.Include(x => x.History).Include(x => x.TransferAttempts).AsSplitQuery().OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.SettlementRequestId)
            .Skip((page - 1) * 20).Take(20).ToListAsync();
        return new(items.Select(x => Map(x, manage)).ToList(), count, page, 20);
    }
    public async Task<SettlementDto> Create(SettlementCreateDto dto)
    {
        var id = UserId();
        var iban = SettlementPolicy.NormalizeIban(dto.Iban);
        var holder = dto.AccountHolder?.Trim() ?? "";
        if (holder.Length is < 3 or > 150 || dto.Amount <= 0 || decimal.Round(dto.Amount, 2) != dto.Amount ||
            string.IsNullOrWhiteSpace(dto.IdempotencyKey) || dto.IdempotencyKey.Length is < 8 or > 100)
            throw new BadRequestException("مبلغ، نام صاحب حساب و شناسه درخواست معتبر وارد کنید.");
        await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var existing = await requests.GetAll().Include(x => x.History).Include(x => x.TransferAttempts)
            .SingleOrDefaultAsync(x => x.SellerId == id && x.IdempotencyKey == dto.IdempotencyKey);
        if (existing != null)
        {
            if (existing.Amount != dto.Amount || existing.Iban != iban || existing.AccountHolder != holder)
                throw new ConflictException("شناسه درخواست قبلاً با اطلاعات دیگری ثبت شده است.");
            return Map(existing);
        }
        if (await Available(id) < dto.Amount) throw new BadRequestException("درآمد آزاد کافی نیست.");
        var now = DateTimeOffset.UtcNow;
        var cycle = SettlementPolicy.Cycle(now);
        DateOnly? scheduled = null;
        try { scheduled = await PaymentDay(cycle.Saturday); }
        catch (ConflictException) { /* Request funds now; set the date when management confirms the calendar. */ }
        var r = new SettlementRequest { SellerId = id, Amount = dto.Amount, Iban = iban, AccountHolder = holder,
            IdempotencyKey = dto.IdempotencyKey, CreatedAt = now, CycleSaturday = cycle.Saturday,
            CutoffAt = cycle.Cutoff, ScheduledDate = scheduled };
        r.History.Add(new() { ActorId = id, Action = "Created", Note = "ثبت درخواست و رزرو درآمد آزاد" });
        await requests.AddAsync(r);
        await unit.SaveChangesAsync(); await tx.CommitAsync();
        return Map(r);
    }
    public async Task<SettlementDto> Act(string code, SettlementActionDto dto)
    {
        var id = UserId();
        if (dto.Action != "Cancel") RequireManager();
        var note = dto.Note?.Trim(); var reference = dto.TransferReference?.Trim();
        if (note?.Length > 1000 || reference?.Length > 150) throw new BadRequestException("توضیح یا شناسه بیش از حد طولانی است.");
        await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var r = await requests.GetAll().Include(x => x.History).Include(x => x.TransferAttempts).SingleOrDefaultAsync(x => x.Code == code)
            ?? throw new NotFoundException("درخواست یافت نشد.");
        if (dto.Action == "Cancel" && r.SellerId != id && !CanManage) throw new ForbiddenException("اجازه لغو این درخواست را ندارید.");
        if (r.Status == "Paid" && dto.Action == "Pay" && r.TransferReference == reference) return Map(r, CanManage);
        if (r.Status == "Transferring" && dto.Action == "StartTransfer") return Map(r, CanManage);
        switch (dto.Action)
        {
            case "Cancel" when r.Status == "Pending": r.Status = "Cancelled"; break;
            case "Reject" when r.Status is "Pending" or "Approved":
                if (string.IsNullOrWhiteSpace(note)) throw new BadRequestException("دلیل رد الزامی است.");
                r.Status = "Rejected"; break;
            case "Approve" when r.Status == "Pending":
                if (string.IsNullOrWhiteSpace(note)) throw new BadRequestException("تأیید تطبیق نام صاحب حساب و شبا در توضیح الزامی است.");
                r.Status = "Approved"; break;
            case "StartTransfer" when r.Status == "Approved":
                // Recheck the confirmed calendar immediately before the real transfer.
                r.ScheduledDate = await PaymentDay(r.CycleSaturday);
                if (DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, SettlementPolicy.Tehran).DateTime) < r.ScheduledDate)
                    throw new BadRequestException("موعد پرداخت این درخواست نرسیده است.");
                r.Status = "Transferring"; break;
            case "Pay" when r.Status == "Transferring":
                if (string.IsNullOrWhiteSpace(reference)) throw new BadRequestException("شناسه واریز واقعی الزامی است.");
                if (await requests.GetAllIncludingDeleted().AnyAsync(x => x.TransferReference == reference))
                    throw new ConflictException("این شناسه واریز قبلاً استفاده شده است.");
                var completed = ActiveAttempt(r, id);
                completed.Status = "Succeeded"; completed.ProviderReference = reference;
                completed.CompletedAt = DateTimeOffset.UtcNow; completed.CompletedById = id;
                completed.ResolutionNote = note; completed.Version = Guid.NewGuid();
                r.Status = "Paid"; r.TransferReference = reference; r.PaidAt = completed.CompletedAt; break;
            case "Retry" when r.Status == "Transferring":
                if (string.IsNullOrWhiteSpace(note)) throw new BadRequestException("نتیجه استعلام و دلیل شکست قطعی انتقال الزامی است.");
                var failed = ActiveAttempt(r, id);
                failed.Status = "FailedConfirmed"; failed.CompletedAt = DateTimeOffset.UtcNow;
                failed.CompletedById = id; failed.ResolutionNote = note; failed.Version = Guid.NewGuid();
                r.Status = "Approved"; break;
            default: throw new ConflictException("این عملیات در وضعیت فعلی مجاز نیست.");
        }
        if (dto.Action == "StartTransfer") ActiveAttempt(r, id);
        r.Version = Guid.NewGuid(); r.UpdatedAt = DateTimeOffset.UtcNow;
        r.History.Add(new() { ActorId = id, Action = dto.Action, Note = note ?? reference });
        await unit.SaveChangesAsync(); await tx.CommitAsync();
        return Map(r, CanManage);
    }
    private static SettlementTransferAttempt ActiveAttempt(SettlementRequest r, int actorId)
    {
        var active = r.TransferAttempts.SingleOrDefault(x => x.Status == "AwaitingConfirmation");
        if (active != null) return active;
        // Also accommodates a transfer started before this additive migration.
        active = new() { AmountToman = r.Amount, Iban = r.Iban, StartedById = actorId };
        r.TransferAttempts.Add(active); return active;
    }
    public async Task<string> Export(DateOnly dueOn)
    {
        RequireManager();
        await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var rows = await requests.GetAll().AsNoTracking().Where(x => x.Status == "Approved" && x.ScheduledDate <= dueOn)
            .OrderBy(x => x.ScheduledDate).ThenBy(x => x.SettlementRequestId).Take(5001).ToListAsync();
        if (rows.Count > 5000) throw new BadRequestException("بازه خروجی بیش از ۵۰۰۰ درخواست دارد؛ تاریخ را محدود کنید.");
        static string Cell(string value)
        {
            if (value.TrimStart().StartsWith('=') || value.TrimStart().StartsWith('+') || value.TrimStart().StartsWith('-') || value.TrimStart().StartsWith('@')) value = "'" + value;
            return "\"" + value.Replace("\"", "\"\"") + "\"";
        }
        var csv = new System.Text.StringBuilder("RequestCode,AccountHolder,IBAN,AmountToman,Currency,ScheduledDate\r\n");
        foreach (var r in rows)
        {
            var scheduled = await PaymentDay(r.CycleSaturday);
            if (scheduled > dueOn) continue;
            csv.AppendLine(string.Join(",", new[] { r.Code, r.AccountHolder, r.Iban,
                r.Amount.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture), "IRT", scheduled.ToString("yyyy-MM-dd") }.Select(Cell)));
        }
        await tx.CommitAsync();
        return csv.ToString();
    }
    public async Task<List<SettlementCalendarDay>> Calendar(DateOnly from, DateOnly to)
    {
        RequireManager();
        return await calendar.GetAll().AsNoTracking().Where(x => x.Date >= from && x.Date <= to).OrderBy(x => x.Date).ToListAsync();
    }
    public async Task SaveCalendar(SettlementCalendarDto dto)
    {
        RequireManager(); var id = UserId();
        if (dto.To < dto.From || dto.To.DayNumber - dto.From.DayNumber > 365 || dto.Holidays == null || dto.Holidays.Any(x => x < dto.From || x > dto.To))
            throw new BadRequestException("بازه تقویم باید حداکثر یک سال و تعطیلی‌ها داخل بازه باشند.");
        await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var existing = await calendar.GetAll().Where(x => x.Date >= dto.From && x.Date <= dto.To).ToDictionaryAsync(x => x.Date);
        for (var date = dto.From; date <= dto.To; date = date.AddDays(1))
        {
            if (!existing.TryGetValue(date, out var day))
            {
                day = new() { Date = date }; await calendar.AddAsync(day);
            }
            day.IsClosed = date.DayOfWeek == DayOfWeek.Friday || dto.Holidays.Contains(date);
            day.ConfirmedById = id; day.UpdatedAt = DateTimeOffset.UtcNow;
        }
        await unit.SaveChangesAsync();
        var affected = await requests.GetAll().Include(x => x.History)
            .Where(x => x.Status == "Pending" || x.Status == "Approved").ToListAsync();
        foreach (var r in affected)
        {
            DateOnly next;
            try { next = await PaymentDay(r.CycleSaturday); }
            catch (ConflictException) { continue; }
            if (next == r.ScheduledDate) continue;
            r.History.Add(new() { ActorId = id, Action = "Rescheduled", Note = $"تغییر تقویم: {r.ScheduledDate:yyyy-MM-dd} → {next:yyyy-MM-dd}" });
            r.ScheduledDate = next; r.Version = Guid.NewGuid();
        }
        await unit.SaveChangesAsync(); await tx.CommitAsync();
    }
}
