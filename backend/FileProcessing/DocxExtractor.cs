using System.Text;
using DocumentFormat.OpenXml.Packaging;

namespace backend.FileProcessing;

public static class DocxExtractor
{
    public static string Extract(string filePath)
    {
        var text = new StringBuilder();

        using var document =
            WordprocessingDocument.Open(
                filePath,
                false
            );

        var body =
            document.MainDocumentPart?
                    .Document?
                    .Body;

        if (body != null)
        {
            text.Append(body.InnerText);
        }

        return text.ToString();
    }
}