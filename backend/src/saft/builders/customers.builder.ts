export type CustomerInput = { id: string; nif: string; name: string; accountId: string; address: string; city: string; country?: string; email?: string | null };
export function buildCustomers(clients: CustomerInput[]) {
  return [...new Map(clients.map((client) => [client.id, client])).values()].map((client) => ({
    CustomerID: client.id, AccountID: client.accountId, CustomerTaxID: client.nif, CompanyName: client.name,
    BillingAddress: { AddressDetail: client.address, City: client.city, Country: client.country ?? 'AO' },
    ...(client.email ? { Email: client.email } : {}), SelfBillingIndicator: 0,
  }));
}
