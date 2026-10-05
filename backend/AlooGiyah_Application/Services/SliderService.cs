using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.File;
using AlooGiyah_Application.DTOs.Slider;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Shared.Exceptions;

namespace AlooGiyah_Application.Services;

public class SliderService : ISliderService
{
    private readonly ISliderQuery _readQuery;

    private readonly IGenericRepository<Slider> _sliderRepository;
    private readonly IFileService _fileService;
    private readonly IUnitOfWork _unitOfWork;

    public SliderService(ISliderQuery readQuery,
        
        IGenericRepository<Slider> sliderRepository,
        IFileService fileService,
        IUnitOfWork unitOfWork)
    {
        _readQuery = readQuery;
        _sliderRepository = sliderRepository;
        _fileService = fileService;
        _unitOfWork = unitOfWork;
    }

    #region Create Slider
    public async Task<SliderDto> CreateSliderAsync(CreateSliderDto dto)
    {
        if (dto.Image == null || dto.Image.Length == 0)
            throw new BadRequestException("تصویر اسلایدر الزامی است");

        if (!dto.Image.ContentType.StartsWith("image/"))
            throw new BadRequestException("فقط فایل تصویری مجاز است");

        // ایجاد Slider
        var slider = new Slider
        {
            Title = dto.Title,
            Description = dto.Description,
            LinkUrl = dto.LinkUrl,
            Order = dto.Order,
            IsActive = true
        };

        await _sliderRepository.AddAsync(slider);
        await _unitOfWork.SaveChangesAsync();

        // آپلود عکس اسلایدر
        var uploadDto = new FileUploadDto
        {
            File = dto.Image,
            EntityCode = slider.Code,
            EntityFile = EntityFile.Slider,
            FileTypeCode = "CD5A1A3870", // image type
            IsPrimary = true
        };

        var file = await _fileService.UploadFileAsync(uploadDto);

        await _fileService.AttachFileAsPrimaryAsync(
            file.FileCode,
            EntityFile.Slider,
            slider.Code
        );

        await _unitOfWork.SaveChangesAsync();

        var imageUrl = await _fileService.GetPrimaryFileUrlAsync(
            EntityFile.Slider,
            slider.Code
        );

        return new SliderDto
        {
            Code = slider.Code,
            Title = slider.Title,
            Description = slider.Description,
            LinkUrl = slider.LinkUrl,
            Order = slider.Order,
            ImageUrl = imageUrl
        };
    }
    #endregion

    #region Get Active Sliders
    public async Task<IEnumerable<SliderDto>> GetActiveSlidersAsync()
    {
        return await _readQuery.GetActiveSlidersAsync();
    }
    #endregion

    #region Delete Slider
    public async Task DeleteSliderAsync(string sliderCode)
    {
        var slider = await _sliderRepository.GetByCodeAsync(sliderCode)
                     ?? throw new NotFoundException("Slider not found");

        slider.IsDeleted = true;

        await _unitOfWork.SaveChangesAsync();
    }
    #endregion
}
