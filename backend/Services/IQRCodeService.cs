using System.Threading.Tasks;

namespace backend.Services;

public interface IQRCodeService
{
    /// <summary>
    /// Generates a QR code PNG for the provided session code and returns the absolute file path.
    /// </summary>
    /// <param name="sessionCode">The unique session code to embed.</param>
    /// <returns>Absolute path to the PNG file, or null if generation fails.</returns>
    Task<string?> GenerateQrCodeAsync(string sessionCode);
}
