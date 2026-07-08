using backend.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Services.AI;

public class LocalQuestionGenerator : IAIProvider
{
    private static readonly Random _random = new();

    public Task<List<GeneratedQuestionDto>> GenerateQuestionsAsync(string text)
    {
        var normalizedText = text.ToLowerInvariant();
        List<GeneratedQuestionDto> selectedPool;

        if (normalizedText.Contains("photo") || normalizedText.Contains("synth"))
        {
            selectedPool = GetPhotosynthesisQuestions();
        }
        else if (normalizedText.Contains("math") || normalizedText.Contains("algebra") || normalizedText.Contains("geometry") || normalizedText.Contains("calculus"))
        {
            selectedPool = GetMathQuestions();
        }
        else if (normalizedText.Contains("code") || normalizedText.Contains("program") || normalizedText.Contains("python") || normalizedText.Contains("java") || normalizedText.Contains("computer") || normalizedText.Contains("software"))
        {
            selectedPool = GetComputerScienceQuestions();
        }
        else if (normalizedText.Contains("history") || normalizedText.Contains("war") || normalizedText.Contains("empire") || normalizedText.Contains("civilization"))
        {
            selectedPool = GetHistoryQuestions();
        }
        else
        {
            selectedPool = GetGeneralKnowledgeQuestions();
        }

        // Shuffle options for each question so correct answer letter changes, and limit count
        var finalQuestions = selectedPool
            .OrderBy(_ => _random.Next())
            .Take(10)
            .Select(q => ShuffleQuestionOptions(q))
            .ToList();

        return Task.FromResult(finalQuestions);
    }

    private static GeneratedQuestionDto ShuffleQuestionOptions(GeneratedQuestionDto original)
    {
        var correctOptionText = original.Options[original.CorrectAnswer[0] - 'A'];
        var shuffledOptions = original.Options.OrderBy(_ => _random.Next()).ToList();
        
        var newCorrectIndex = shuffledOptions.IndexOf(correctOptionText);
        string newCorrectLetter = newCorrectIndex switch
        {
            0 => "A",
            1 => "B",
            2 => "C",
            _ => "D"
        };

        return new GeneratedQuestionDto
        {
            Question = original.Question,
            Options = shuffledOptions,
            CorrectAnswer = newCorrectLetter,
            Explanation = original.Explanation
        };
    }

    private static List<GeneratedQuestionDto> GetPhotosynthesisQuestions()
    {
        return new List<GeneratedQuestionDto>
        {
            new() {
                Question = "Which pigment primarily absorbs light during photosynthesis?",
                Options = new() { "Chlorophyll a", "Carotenoid", "Phycobilin", "Anthocyanin" },
                CorrectAnswer = "A",
                Explanation = "Chlorophyll a is the primary photosynthetic pigment that absorbs blue-violet and red light."
            },
            new() {
                Question = "Where do the light-dependent reactions of photosynthesis take place?",
                Options = new() { "Thylakoid membrane", "Stroma", "Mitochondrial matrix", "Cytoplasm" },
                CorrectAnswer = "A",
                Explanation = "The light-dependent reactions occur in the thylakoid membranes where chlorophyll is embedded."
            },
            new() {
                Question = "What is the primary organic product of photosynthesis?",
                Options = new() { "Glucose", "Oxygen", "Carbon dioxide", "Water" },
                CorrectAnswer = "A",
                Explanation = "Photosynthesis uses water, CO2, and light to synthesize Glucose (chemical energy)."
            },
            new() {
                Question = "Which of the following is NOT required for the process of photosynthesis?",
                Options = new() { "Oxygen", "Carbon dioxide", "Water", "Light energy" },
                CorrectAnswer = "A",
                Explanation = "Oxygen is a byproduct, not a reactant, of the photosynthesis process."
            },
            new() {
                Question = "What is the main role of water in the light-dependent reactions?",
                Options = new() { "To provide electrons to replace those lost by chlorophyll", "To absorb photons", "To convert NADP+ to NADPH", "To synthesize ATP directly" },
                CorrectAnswer = "A",
                Explanation = "Photolysis of water splits it into hydrogen ions, oxygen, and electrons to replenish photosystem II."
            },
            new() {
                Question = "What cycle occurs in the stroma of the chloroplast during the light-independent reactions?",
                Options = new() { "Calvin Cycle", "Krebs Cycle", "Glycolysis", "Citric Acid Cycle" },
                CorrectAnswer = "A",
                Explanation = "The Calvin Cycle uses ATP and NADPH to fix carbon dioxide into sugars in the stroma."
            }
        };
    }

    private static List<GeneratedQuestionDto> GetMathQuestions()
    {
        return new List<GeneratedQuestionDto>
        {
            new() {
                Question = "What is the derivative of f(x) = 3x^2 + 5x - 7 with respect to x?",
                Options = new() { "6x + 5", "3x + 5", "6x^2 + 5", "6x - 7" },
                CorrectAnswer = "A",
                Explanation = "Using the power rule, d/dx(3x^2) = 6x and d/dx(5x) = 5. The constant term disappears."
            },
            new() {
                Question = "Solve for x in the equation: 2^(x + 1) = 16.",
                Options = new() { "3", "4", "2", "5" },
                CorrectAnswer = "A",
                Explanation = "16 is 2^4. Therefore, x + 1 = 4, which means x = 3."
            },
            new() {
                Question = "What is the value of cos(pi/3)?",
                Options = new() { "1/2", "sqrt(3)/2", "1", "sqrt(2)/2" },
                CorrectAnswer = "A",
                Explanation = "Cos of 60 degrees (pi/3 radians) is exactly 0.5 or 1/2."
            },
            new() {
                Question = "If a triangle has sides of lengths 5, 12, and 13, what kind of triangle is it?",
                Options = new() { "Right-angled", "Equilateral", "Isosceles", "Obtuse-angled" },
                CorrectAnswer = "A",
                Explanation = "Since 5^2 + 12^2 = 25 + 144 = 169 = 13^2, it satisfies the Pythagorean theorem and is a right triangle."
            },
            new() {
                Question = "What is the sum of the interior angles of a regular hexagon?",
                Options = new() { "720 degrees", "540 degrees", "900 degrees", "360 degrees" },
                CorrectAnswer = "A",
                Explanation = "Using the formula (n-2) * 180, for n=6 we get (4) * 180 = 720 degrees."
            }
        };
    }

    private static List<GeneratedQuestionDto> GetComputerScienceQuestions()
    {
        return new List<GeneratedQuestionDto>
        {
            new() {
                Question = "Which data structure operates on a Last-In, First-Out (LIFO) basis?",
                Options = new() { "Stack", "Queue", "Binary Tree", "Linked List" },
                CorrectAnswer = "A",
                Explanation = "A Stack pushes elements on top and pops them from the top, acting as a LIFO structure."
            },
            new() {
                Question = "What is the average time complexity of searching in a Hash Table?",
                Options = new() { "O(1)", "O(log n)", "O(n)", "O(n log n)" },
                CorrectAnswer = "A",
                Explanation = "Hash tables allow direct addressing, yielding average lookup times of O(1)."
            },
            new() {
                Question = "Which protocol is used to securely transfer web pages over the internet?",
                Options = new() { "HTTPS", "HTTP", "FTP", "SMTP" },
                CorrectAnswer = "A",
                Explanation = "HTTPS encrypts the communication channel between client and server using SSL/TLS."
            },
            new() {
                Question = "What does HTML stand for?",
                Options = new() { "HyperText Markup Language", "HyperTech Main Language", "HighTransfer Markup Line", "Hyperlink Text Makeup Language" },
                CorrectAnswer = "A",
                Explanation = "HTML is the standard markup language used for creating web pages."
            },
            new() {
                Question = "In object-oriented programming, what is the process of hiding internal details and showing only functionality called?",
                Options = new() { "Encapsulation", "Polymorphism", "Inheritance", "Abstraction" },
                CorrectAnswer = "A",
                Explanation = "Encapsulation wraps code and data together into a single unit, shielding internals from outside access."
            }
        };
    }

    private static List<GeneratedQuestionDto> GetHistoryQuestions()
    {
        return new List<GeneratedQuestionDto>
        {
            new() {
                Question = "Who was the first President of the United States?",
                Options = new() { "George Washington", "Thomas Jefferson", "John Adams", "Abraham Lincoln" },
                CorrectAnswer = "A",
                Explanation = "George Washington served as president from 1789 to 1797 after leading the Continental Army."
            },
            new() {
                Question = "In which year did World War II end?",
                Options = new() { "1945", "1944", "1918", "1953" },
                CorrectAnswer = "A",
                Explanation = "World War II concluded in 1945 with the formal surrenders of Germany and Japan."
            },
            new() {
                Question = "Which ancient civilization constructed the Great Pyramid of Giza?",
                Options = new() { "Ancient Egyptians", "Mesopotamians", "Ancient Romans", "Aztecs" },
                CorrectAnswer = "A",
                Explanation = "The Fourth Dynasty Pharaoh Khufu built the pyramid around 2560 BC."
            },
            new() {
                Question = "What document, signed in 1215, limited the absolute power of the English Monarch?",
                Options = new() { "Magna Carta", "Declaration of Independence", "The Constitution", "Treaty of Versailles" },
                CorrectAnswer = "A",
                Explanation = "King John signed the Magna Carta, establishing that everyone, including the king, was subject to the law."
            }
        };
    }

    private static List<GeneratedQuestionDto> GetGeneralKnowledgeQuestions()
    {
        return new List<GeneratedQuestionDto>
        {
            new() {
                Question = "What is the capital city of France?",
                Options = new() { "Paris", "London", "Rome", "Berlin" },
                CorrectAnswer = "A",
                Explanation = "Paris is the capital and most populous city of France."
            },
            new() {
                Question = "Which chemical element has the symbol 'O' on the Periodic Table?",
                Options = new() { "Oxygen", "Gold", "Osmium", "Carbon" },
                CorrectAnswer = "A",
                Explanation = "O is the atomic symbol for Oxygen (atomic number 8)."
            },
            new() {
                Question = "Which planet in our solar system is known as the Red Planet?",
                Options = new() { "Mars", "Venus", "Jupiter", "Saturn" },
                CorrectAnswer = "A",
                Explanation = "Mars is covered in iron oxide (rust) which gives it a distinct reddish appearance."
            },
            new() {
                Question = "What is the largest mammal on Earth?",
                Options = new() { "Blue Whale", "African Elephant", "Giraffe", "Orca" },
                CorrectAnswer = "A",
                Explanation = "The Blue Whale can grow up to 30 meters long and weigh over 170 tonnes."
            },
            new() {
                Question = "How many continents are there on Earth?",
                Options = new() { "7", "6", "8", "5" },
                CorrectAnswer = "A",
                Explanation = "Earth is divided into 7 traditional continents: Africa, Antarctica, Asia, Europe, North America, Oceania, and South America."
            }
        };
    }
}
