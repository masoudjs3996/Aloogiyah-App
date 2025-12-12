using AlooGiyah_Application.DTOs.Article;
using AlooGiyah_Application.Interfaces;
using AlooGiyah_Application.Interfaces.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Commons;
using AlooGiyah_Shared.Exceptions;
using AlooGiyah_Shared.Seo;
using AutoMapper;
using System.Linq.Expressions;

namespace AlooGiyah_Application.Services
{
    public class ArticleService : IArticleService
    {
        #region Constructor
        private readonly IGenericRepository<Article> _articleRepository;
        private readonly IGenericRepository<Category> _categoryRepository;
        private readonly ICurrentUserService _currentUserService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ArticleService(
            IGenericRepository<Article> articleRepository,
            ICurrentUserService currentUserService,
            IGenericRepository<Category> categoryRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
            _articleRepository = articleRepository;
            _categoryRepository = categoryRepository;
            _currentUserService = currentUserService;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }
        #endregion


        #region Create
        public async Task<ArticleDto> CreateAsync(ArticleCreateDto dto)
        {
            if (string.IsNullOrEmpty(_currentUserService.UserId))
                throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

            var authorId = int.Parse(_currentUserService.UserId);

            List<Category> categories = new();
            foreach (var code in dto.CategoryCodes)
            {
                var categoryId = await _categoryRepository.GetIdByCodeAsync(code, c => c.CategoryId);
                if (categoryId == null)
                    throw new NotFoundException($"Category with code {code} not found");

                categories.Add(new Category { CategoryId = categoryId.Value });
            }

            var article = _mapper.Map<Article>(categories);

            article.MetaTitle = dto.MetaTitle ?? SeoHelper.GenerateMetaTitle(dto.Title);
            article.MetaDescription = dto.MetaDescription ?? SeoHelper.GenerateMetaDescription(dto.Title);
            article.MetaKeywords = dto.MetaKeywords ?? SeoHelper.GenerateMetaKeywords(dto.Title);

            // Slug (می‌توانی کنترل یونیک بودن اضافه کنی)
            string baseSlug = SeoHelper.GenerateSlug(article.MetaTitle);
            string slug = baseSlug;
            int counter = 1;

            while (await _categoryRepository.ExistsAsync(c => c.Slug == slug))
            {
                slug = $"{baseSlug}-{counter}";
                counter++;
            }

            article.Slug = slug;

            await _articleRepository.AddAsync(article);
            await _unitOfWork.SaveChangesAsync();
            var articleDto = _mapper.Map<ArticleDto>(article);
            articleDto.CategoryCodes = dto.CategoryCodes;

            return articleDto;
        }
        #endregion

        #region Get By Filter
        public async Task<PagedResult<ArticleListDto>> GetByFilterAsync(ArticleFilterDto dto)
        {
            Expression<Func<Article, bool>> predicate = a => !a.IsDeleted;

            if (!string.IsNullOrEmpty(dto.SearchTerm))
                predicate = predicate.And(a =>
                    a.Title.Contains(dto.SearchTerm) ||
                    a.Content.Contains(dto.SearchTerm));

            if (!string.IsNullOrEmpty(dto.AuthorCode))
                predicate = predicate.And(a => a.Author.Code == dto.AuthorCode);

            if (!string.IsNullOrEmpty(dto.CategoryCode))
                predicate = predicate.And(a => a.Categories.Any(c => c.Code == dto.CategoryCode));

            return await _articleRepository.GetPagedProjectedAsync(
                filter: predicate,
                selector: a => new ArticleListDto
                {
                    Code = a.Code,
                    Title = a.Title,
                    AuthorCode = a.Author.Code,
                    CategoryCodes = a.Categories.Select(c => c.Code).ToList(),
                    CreatedAt = a.CreatedAt
                },
                pageNumber: dto.PageNumber,
                pageSize: dto.PageSize,
                orderBy: a => a.CreatedAt
            );
        }
        #endregion

        #region Get BY Code
        public async Task<ArticleDto?> GetByCodeAsync(string code)
        {
            var entity = await _articleRepository.GetByCodeAsync(code);
            if (entity == null) return null;

            var articleDto = _mapper.Map<ArticleDto>(entity);
            articleDto.AuthorCode = entity.Author?.Code ?? "";
            articleDto.CategoryCodes = entity.Categories.Select(c => c.Code).ToList();

            articleDto.Slug = entity.Slug;
            articleDto.MetaTitle = entity.MetaTitle;
            articleDto.MetaDescription = entity.MetaDescription;
           

            return articleDto;
        }
        #endregion

        #region Update
        public async Task<bool> UpdateAsync(ArticleUpdateDto dto)
        {
            var entity = await _articleRepository.GetByCodeAsync(dto.ArticleCode);
            if (entity == null) return false;

            var categories = new List<Category>();

            foreach (var code in dto.CategoryCodes)
            {
                var categoryId = await _categoryRepository.GetIdByCodeAsync(code, c => c.CategoryId);
                if (categoryId == null)
                    throw new NotFoundException($"Category with code {code} not found");

                categories.Add(new Category { CategoryId = categoryId.Value });
            }

            entity.Title = dto.Title;
            entity.Content = dto.Content;
            entity.Categories = categories;

            await _articleRepository.UpdateAsync(entity);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }
        #endregion

        #region Delete
        public async Task<bool> DeleteAsync(string code)
        {
            var entity = await _articleRepository.GetByCodeAsync(code);
            if (entity == null) return false;

            await _articleRepository.DeleteAsync(entity);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }
        #endregion
    }
}
