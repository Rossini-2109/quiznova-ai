using Microsoft.Extensions.Configuration;
using System;

namespace backend.Services.AI
{
    public static class AIConfigValidator
    {
        /// <summary>
        /// Ensures the selected AI provider has the required configuration (API keys).
        /// Throws a ConfigurationException if validation fails.
        /// </summary>
        public static void EnsureValid(IConfiguration config)
        {
            var provider = config["AIProvider"]?.ToLowerInvariant() ?? "local";
            switch (provider)
            {
                case "gemini":
                    if (string.IsNullOrWhiteSpace(config["Gemini:ApiKey"]))
                        throw new ConfigurationException("Gemini API key is missing. Set 'Gemini:ApiKey' in appsettings.json.");
                    break;
                case "openai":
                    if (string.IsNullOrWhiteSpace(config["OpenAI:ApiKey"]))
                        throw new ConfigurationException("OpenAI API key is missing. Set 'OpenAI:ApiKey' in appsettings.json.");
                    break;
                case "ollama":
                    // Ollama may run locally without an API key; add checks if needed.
                    break;
                default:
                    // Local provider requires no external config.
                    break;
            }
        }
    }

    public class ConfigurationException : Exception
    {
        public ConfigurationException(string message) : base(message) { }
    }
}
