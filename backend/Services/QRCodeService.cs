using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Threading.Tasks;
using QRCoder;

namespace backend.Services;

public class QRCodeService : IQRCodeService
{
    private readonly string _qrFolder;
    private readonly string _frontendUrl;

    public QRCodeService()
    {
        // Store QR codes in wwwroot/qrcodes
        var contentRoot = AppDomain.CurrentDomain.BaseDirectory;
        _qrFolder = Path.Combine(contentRoot, "wwwroot", "qrcodes");
        if (!Directory.Exists(_qrFolder))
        {
            Directory.CreateDirectory(_qrFolder);
        }
        // Get frontend base URL for join links
        _frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "https://quiznova-ai-grdq.onrender.com";
    }

    public async Task<string?> GenerateQrCodeAsync(string sessionCode)
    {
        try
        {
            // Build full join URL that will be embedded in the QR code
            var joinUrl = $"{_frontendUrl}/student/lobby/{sessionCode}";
            var qrGenerator = new QRCodeGenerator();
            var qrData = qrGenerator.CreateQrCode(joinUrl, QRCodeGenerator.ECCLevel.Q);
            var qrCode = new QRCode(qrData);
            using var bitmap = qrCode.GetGraphic(20);
            var filePath = Path.Combine(_qrFolder, $"{sessionCode}.png");
            // Save as PNG
            await Task.Run(() => bitmap.Save(filePath, ImageFormat.Png));
            return filePath;
        }
        catch
        {
            return null;
        }
    }
}
