using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Enums;
using Microsoft.AspNetCore.Http;


namespace AlooGiyah_Domain.Interfaces;

public interface IFileRepository
{
    Task<Files> AddAsync(Files file);
    Task<Files?> GetByIdAsync(int id);
}
