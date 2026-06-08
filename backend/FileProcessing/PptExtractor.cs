using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Presentation;

namespace backend.FileProcessing;

public static class PptxExtractor
{
    public static string Extract(string filePath)
    {
        using var presentation =
            PresentationDocument.Open(
                filePath,
                false
            );

        var text = "";

        var slides =
            presentation.PresentationPart?
                .SlideParts;

        if (slides == null)
            return "";

        foreach (var slide in slides)
{
    if (slide.Slide == null)
        continue;

    var texts =
        slide.Slide.Descendants<DocumentFormat.OpenXml.Drawing.Text>();

            foreach (var item in texts)
            {
                text += item.Text + " ";
            }
        }

        return text;
    }
}