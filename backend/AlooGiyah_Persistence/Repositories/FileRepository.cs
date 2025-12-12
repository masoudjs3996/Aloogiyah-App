using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Persistence.Repositories;

public class FileRepository : IFileRepository
{
    #region Constructor
    private readonly AlooGiyahDbContext _context;

    public FileRepository(AlooGiyahDbContext context)
    {
        _context = context;
    }
    #endregion


    #region Add File
    public Task<Files> AddAsync(Files file)
    {
        _context.Files.Add(file); 
        return Task.FromResult(file); 
    }
    #endregion

    #region get By Id 
    public async Task<Files?> GetByIdAsync(int id)
    {
        return await _context.Files.FirstOrDefaultAsync(f => f.FileId == id);
    }
    #endregion
}

