using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace backend.Models;

public class Folder
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public Guid TeacherId { get; set; }

    public Guid? ParentFolderId { get; set; }

    /// <summary>Hex color code for folder, e.g. "#6366f1"</summary>
    public string Color { get; set; } = "#6366f1";

    /// <summary>Icon identifier string, e.g. "folder", "book", "star"</summary>
    public string Icon { get; set; } = "folder";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime LastModifiedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [JsonIgnore]
    public Folder? ParentFolder { get; set; }

    public ICollection<Folder> SubFolders { get; set; } = new List<Folder>();

    [JsonIgnore]
    public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
}
