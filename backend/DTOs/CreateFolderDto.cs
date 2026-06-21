namespace backend.DTOs;

public class CreateFolderDto
{
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }
    public string? Icon { get; set; }
    public Guid? ParentFolderId { get; set; }
}