# Matriz fiscal — fontes e estado de implementação

Consultada em 03-10-2026. Esta matriz é uma referência técnica: não substitui
o diploma aplicável nem autoriza cálculo quando o estado é `NEEDS_OFFICIAL_CONFIRMATION`.

| Imposto/obrigação | Enquadramento | Regra confirmada | Periodicidade/prazo | Fonte oficial | Estado |
| --- | --- | --- | --- | --- | --- |
| Imposto Industrial | Geral | Matéria colectável por declaração e demonstrações financeiras; taxa geral 25%, com sectores próprios | Declaração/pagamento definitivo: último dia útil de Maio; provisório: Agosto, quando aplicável | [Portal do Contribuinte — II](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-industrial), Lei n.º 19/14 alterada pela Lei n.º 26/20 | CURRENT — regra condicionada ao sector e factos |
| Imposto Industrial | Simplificado | Aplica-se aos sujeitos de II abrangidos pela não sujeição de IVA; declaração anual simplificada | Último dia útil de Abril | [Portal do Contribuinte — II](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-industrial) | CURRENT — requer matrícula/enquadramento por imposto |
| IVA | Geral | Modelo 7, anexos e pagamento; SAF-T listado como obrigação do calendário | Mensal: Modelo 7 até dia 15; SAF-T conforme calendário 2026 | [Calendário Fiscal AGT 2026](https://portaldocontribuinte.minfin.gov.ao/pdfs/CALENDARIO_FISCAL_2026.pdf) | CURRENT para 2026 |
| IVA | Simplificado | Calendário lista declaração/pagamento; fonte aberta não demonstrou diploma vigente suficiente para materializar fórmula | Calendário 2026 indica datas trimestrais/mensais conforme tabela oficial | [Calendário Fiscal AGT 2026](https://portaldocontribuinte.minfin.gov.ao/pdfs/CALENDARIO_FISCAL_2026.pdf) | NEEDS_OFFICIAL_CONFIRMATION — não calcular imposto definitivo |
| IRT Grupo A | Obrigação laboral | Liquidação mensal pela entidade pagadora; tabela 2026 já implementada e testada | Decorre apenas de rendimentos/trabalhadores aplicáveis | [Portal do Contribuinte — IRT](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-rendimentos-do-trabalho), Lei n.º 14/25 | CURRENT — motor Payroll |
| INSS | Obrigação social | Base e taxas tratadas pelo motor Payroll; subsídio de férias excluído da base segundo fonte registada | Decorre de trabalhadores aplicáveis | Decreto Presidencial n.º 227/18 | CURRENT — motor Payroll |
| SAF-T | Obrigação acessória | Não é regime; aplicabilidade depende de enquadramento/regra oficial | Calendário 2026 lista submissão para IVA Geral | [Calendário Fiscal AGT 2026](https://portaldocontribuinte.minfin.gov.ao/pdfs/CALENDARIO_FISCAL_2026.pdf) | CURRENT para calendário 2026; regra de aplicabilidade configurável |

## Salvaguardas

- O calendário anual não é uma regra fiscal permanente. Para 2027, sem fonte oficial carregada, devolver `OFFICIAL_CALENDAR_PENDING`.
- Não inferir automaticamente regimes por imposto a partir de `Tenant.regime`; dados legados devem permanecer `REVIEW_REQUIRED` até decisão auditável.
- Não configurar limiares de volume, fórmula de IVA Simplificado, deduções de fornecedores ou mudança automática de regime sem diploma e vigência confirmados.
