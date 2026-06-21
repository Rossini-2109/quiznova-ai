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
        _qrFolder = Path.Combine(env.WebRootPath, "qrcodes");

        if (!Directory.Exists(_qrFolder))
        {
            Directory.CreateDirectory(_qrFolder);
        }

        _frontendUrl =
            Environment.GetEnvironmentVariable("FRONTEND_URL")
            ?? "https://quiznova-ai-eta.vercel.app";
    }

    public async Task<string?> GenerateQrCodeAsync(string sessionCode)
    {
        try
        {
            var joinUrl = $"{_frontendUrl}/student/lobby/{sessionCode}";

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

            Console.WriteLine($"QR saved to: {filePath}");
            Console.WriteLine($"File exists: {File.Exists(filePath)}");

            return filePath;
        }
        catch (Exception ex)
        {
            Console.WriteLine("QR ERROR:");
            Console.WriteLine(ex.ToString());

            return null;
        }
    }
}