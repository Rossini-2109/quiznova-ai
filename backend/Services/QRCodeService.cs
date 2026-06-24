using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using QRCoder;

namespace backend.Services;

public class QRCodeService : IQRCodeService
{
    private readonly string _qrFolder;
    private readonly string _frontendUrl;

    public QRCodeService(IWebHostEnvironment env)
    {
        // Save inside actual wwwroot
        _qrFolder = Path.Combine(env.WebRootPath, "qrcodes");

        if (!Directory.Exists(_qrFolder))
        {
            Directory.CreateDirectory(_qrFolder);
        }
        _frontendUrl =
            Environment.GetEnvironmentVariable("FRONTEND_URL")
            ?? Environment.GetEnvironmentVariable("NEXT_PUBLIC_FRONTEND_URL")
            ?? "https://quiznova-ai-grdq.onrender.com";
        Console.WriteLine($"[QRCodeService] Frontend URL resolved to: {_frontendUrl}");
    }

    public async Task<string?> GenerateQrCodeAsync(string sessionCode)
    {
        try
        {
            var joinUrl = $"{_frontendUrl}/join?quizCode={sessionCode}";

            Console.WriteLine($"Generating QR for: {joinUrl}");

            using var qrGenerator = new QRCodeGenerator();

            using var qrData =
                qrGenerator.CreateQrCode(
                    joinUrl,
                    QRCodeGenerator.ECCLevel.Q
                );

            var pngQrCode = new PngByteQRCode(qrData);

            byte[] qrBytes = pngQrCode.GetGraphic(20);

            var filePath =
                Path.Combine(
                    _qrFolder,
                    $"{sessionCode}.png"
                );

            await File.WriteAllBytesAsync(
                filePath,
                qrBytes
            );

            Console.WriteLine($"QR saved: {filePath}");

            return filePath;
        }
        catch (Exception ex)
{
    throw new Exception($"QR ERROR: {ex}");
}
    }
}