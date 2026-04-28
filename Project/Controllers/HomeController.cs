using Microsoft.AspNetCore.Mvc;
using AcdProject.Models.Entities;
using System.IO;
using System.Text.Json;
namespace AcdProject.Project.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            string filePath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "andonData.json");
            string jsonString = System.IO.File.ReadAllText(filePath);
            var viewModel = JsonSerializer.Deserialize<AndonViewModel>(jsonString, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            return View(viewModel);
        }
        public IActionResult Dashboard()
        {
            return View();
        }
         public IActionResult wizard()
        {
            string filePath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "andonData.json");
            string jsonString = System.IO.File.ReadAllText(filePath);
            var viewModel = JsonSerializer.Deserialize<AndonViewModel>(jsonString, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            return View(viewModel);
        }
    }
}
