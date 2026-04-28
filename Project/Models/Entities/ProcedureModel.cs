namespace AcdProject.Models.Entities
{
    public class ProcedureModel
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public List<string> Metrics { get; set; } 
    }
}