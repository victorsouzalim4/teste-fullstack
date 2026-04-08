using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Parking.Api.Models
{
    [Table("vinculo_veiculo")]
    public class VinculoVeiculo
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public decimal? ValorMensalidade { get; set; }

        public DateTime DataInicio { get; set; } = DateTime.UtcNow;
        public DateTime? DataFim { get; set; }

        [Required]
        public Guid ClienteId { get; set; }
        public Guid VeiculoId { get; set; }
    }
}
