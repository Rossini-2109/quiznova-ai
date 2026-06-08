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

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [JsonIgnore]
    public Folder? ParentFolder { get; set; }

    public ICollection<Folder> SubFolders { get; set; } = new List<Folder>();

    [JsonIgnore]
    public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
}
