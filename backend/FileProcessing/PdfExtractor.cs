using UglyToad.PdfPig;

namespace backend.FileProcessing;

public static class PdfExtractor
{
    public static string Extract(string filePath)
    {
        using var document = PdfDocument.Open(filePath);

        var text = "";

        foreach (var page in document.GetPages())
        {
            text += page.Text + "\n";
        }

        return text;
    }
}