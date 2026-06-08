namespace backend.Services;

using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

public interface IQuizImportService
{
    /// <summary>
    /// Imports a quiz from an uploaded file, creating Quiz and Question entities.
    /// </summary>
    /// <param name="file">The uploaded file (PDF, DOCX, TXT, etc.).</param>
    /// <param name="teacherId">The ID of the teacher creating the quiz.</param>
    /// <returns>The created Quiz Id.</returns>
    Task<Guid> ImportQuizAsync(IFormFile file, Guid teacherId);
}
