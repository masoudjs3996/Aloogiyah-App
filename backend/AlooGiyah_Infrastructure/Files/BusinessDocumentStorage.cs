using AlooGiyah_Domain.Interfaces;
using Microsoft.Extensions.Configuration;
namespace AlooGiyah_Infrastructure.Files;
public class BusinessDocumentStorage(IConfiguration config) : ChatFileStorage(config, "BusinessDocuments", "BusinessPath"), IBusinessDocumentStorage { protected override bool AllowVideo => false; }
