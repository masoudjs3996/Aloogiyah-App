using AlooGiyah_Application.DTOs.Wallet;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface IWalletQuery
{
    Task<WalletDto?> GetWalletByUserCodeAsync();
}
