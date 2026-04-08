using Microsoft.EntityFrameworkCore;
using Parking.Api.Data;
using Parking.Api.Models;

namespace Parking.Api.Services
{
    public class FaturamentoService
    {
        private readonly AppDbContext _db;

        public FaturamentoService(AppDbContext db) => _db = db;

        public async Task<List<Fatura>> GerarAsync(
            string competencia,
            CancellationToken ct = default
        )
        {
            var part = competencia.Split('-');
            var ano = int.Parse(part[0]);
            var mes = int.Parse(part[1]);

            var inicioMes = new DateTime(ano, mes, 1, 0, 0, 0, DateTimeKind.Utc);
            var fimMes = new DateTime(
                ano,
                mes,
                DateTime.DaysInMonth(ano, mes),
                23,
                59,
                59,
                DateTimeKind.Utc
            );

            var clientes = await _db.Clientes.ToListAsync(ct);
            var faturasGeradas = new List<Fatura>();

            foreach (var cli in clientes)
            {
                if (
                    await _db.Faturas.AnyAsync(
                        f => f.ClienteId == cli.Id && f.Competencia == competencia,
                        ct
                    )
                )
                    continue;

                var vinculosNoMes = await _db
                    .VinculosVeiculos.AsNoTracking()
                    .Where(v =>
                        v.ClienteId == cli.Id
                        && v.ValorMensalidade != null
                        && v.DataInicio <= fimMes
                        && (v.DataFim == null || v.DataFim >= inicioMes)
                    )
                    .ToListAsync(ct);

                if (!vinculosNoMes.Any())
                    continue;

                decimal valorTotalFatura = 0;
                var detalhesVeiculos = new List<FaturaVeiculo>();

                foreach (var vinculo in vinculosNoMes)
                {
                    var dataEfetivaInicio =
                        vinculo.DataInicio > inicioMes ? vinculo.DataInicio : inicioMes;

                    var dataEfetivaFim =
                        (vinculo.DataFim == null || vinculo.DataFim > fimMes)
                            ? fimMes
                            : vinculo.DataFim.Value;

                    int diasUso = (dataEfetivaFim.Date - dataEfetivaInicio.Date).Days + 1;

                    if (diasUso > 30)
                        diasUso = 30;

                    decimal valorMensalidade = vinculo.ValorMensalidade ?? 0m;
                    decimal valorProporcional = (valorMensalidade / 30m) * diasUso;

                    valorTotalFatura += valorProporcional;

                    detalhesVeiculos.Add(new FaturaVeiculo { VeiculoId = vinculo.VeiculoId });
                }

                var novaFatura = new Fatura
                {
                    Id = Guid.NewGuid(),
                    Competencia = competencia,
                    ClienteId = cli.Id,
                    Valor = Math.Round(valorTotalFatura, 2),
                    CriadaEm = DateTime.UtcNow,
                    Observacao = $"Faturamento proporcional baseado em histórico de vínculos.",
                    Veiculos = detalhesVeiculos,
                };

                _db.Faturas.Add(novaFatura);
                faturasGeradas.Add(novaFatura);
            }

            await _db.SaveChangesAsync(ct);

            return faturasGeradas;
        }
    }
}
