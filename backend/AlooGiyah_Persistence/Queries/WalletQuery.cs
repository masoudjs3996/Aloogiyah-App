using AlooGiyah_Application.DTOs.Wallet;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Shared.Exceptions;
namespace AlooGiyah_Persistence.Queries;
public class WalletQuery : BaseQuery, IWalletQuery
{
    private readonly ICurrentUserService _user;
    public WalletQuery(IDbConnectionFactory factory, ICurrentUserService user) : base(factory) { _user = user; }
    public Task<WalletDto?> GetWalletByUserCodeAsync() => QueryFirstOrDefaultAsync<WalletDto>(
        "SELECT \"Code\", \"Balance\", \"HeldAmount\" FROM \"Wallets\" WHERE NOT \"IsDeleted\" AND \"UserId\"=@UserId", new { UserId = QueryAccess.UserId(_user) });
}
