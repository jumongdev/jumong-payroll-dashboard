import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/table"
import { createCheque, updateChequeStatus, deleteCheque } from "@/lib/actions/cheques"
import { addSupplier } from "@/lib/actions/suppliers"
import { addBankAccount } from "@/lib/actions/bank-accounts"
import { DeleteSupplierButton, DeleteBankAccountButton } from "@/components/delete-confirm-button"
import { EditSupplierButton } from "@/components/edit-supplier-button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { CreditCard, Plus, Check, X, Trash2, Building, Landmark } from "lucide-react"

export default async function ChequesPage() {
  const session = await auth()
  if (session?.user?.role !== "admin") redirect("/dashboard/account")

  const [cheques, suppliers, bankAccounts] = await Promise.all([
    db.cheque.findMany({ orderBy: { issueDate: "desc" } }),
    db.supplier.findMany({ orderBy: { name: "asc" } }),
    db.bankAccount.findMany({ orderBy: { bank: "asc" } }),
  ])

  const totalIssued = cheques.filter((c) => c.status === "issued").reduce((s, c) => s + c.amount, 0)
  const totalCleared = cheques.filter((c) => c.status === "cleared").reduce((s, c) => s + c.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Cheque Tracking</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {cheques.length} cheques &middot; Issued: {formatCurrency(totalIssued)} &middot; Cleared: {formatCurrency(totalCleared)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-zinc-500 uppercase">Total Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-amber-700">{formatCurrency(totalIssued)}</p>
            <p className="text-xs text-zinc-400">{cheques.filter((c) => c.status === "issued").length} pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-zinc-500 uppercase">Cleared</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-emerald-700">{formatCurrency(totalCleared)}</p>
            <p className="text-xs text-zinc-400">{cheques.filter((c) => c.status === "cleared").length} cheques</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-zinc-500 uppercase">Bounced / Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-red-700">
              {formatCurrency(cheques.filter((c) => c.status === "bounced" || c.status === "cancelled").reduce((s, c) => s + c.amount, 0))}
            </p>
            <p className="text-xs text-zinc-400">{cheques.filter((c) => c.status === "bounced" || c.status === "cancelled").length} cheques</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus size={16} />
            Issue New Cheque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCheque} className="grid gap-3 md:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Cheque No.</label>
              <Input name="chequeNo" required placeholder="e.g. 000123" className="h-9 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Payee (Supplier)</label>
              <input
                list="supplier-list"
                name="payee"
                required
                placeholder="Type or select supplier..."
                className="flex h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
              />
              <datalist id="supplier-list">
                {suppliers.map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Amount</label>
              <Input name="amount" type="number" step="0.01" required placeholder="0.00" className="h-9 text-sm" />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-zinc-700 mb-1">Issue Date</label>
                <Input name="issueDate" type="date" required className="h-9 text-sm" />
              </div>
              <Button type="submit" size="sm" className="h-9 shrink-0">
                <Plus size={14} className="mr-1" /> Issue
              </Button>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Bank</label>
              <input
                list="bank-list"
                name="bank"
                placeholder="Type or select bank..."
                className="flex h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
              />
              <datalist id="bank-list">
                {[...new Set(bankAccounts.map((b) => b.bank))].map((b) => (
                  <option key={b} value={b} />
                ))}
                <option value="BDO" />
                <option value="BPI" />
                <option value="Metrobank" />
                <option value="Landbank" />
                <option value="PNB" />
                <option value="Security Bank" />
                <option value="UnionBank" />
                <option value="China Bank" />
                <option value="RCBC" />
                <option value="EastWest" />
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Voucher/Ref No.</label>
              <Input name="voucherNo" placeholder="Optional" className="h-9 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 mb-1">Notes</label>
              <Input name="notes" placeholder="What's this payment for?" className="h-9 text-sm" />
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building size={16} className="text-emerald-600" />
              Suppliers ({suppliers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addSupplier} className="flex flex-col gap-2 mb-3">
              <div className="flex gap-2">
                <Input name="name" required placeholder="Supplier name" className="flex-1 h-9 text-sm" />
                <Button type="submit" size="sm" className="h-9 shrink-0">
                  <Plus size={14} className="mr-1" /> Add
                </Button>
              </div>
              <div className="flex gap-2">
                <Input name="contact" placeholder="Agent/Contact person" className="flex-1 h-8 text-xs" />
                <Input name="phone" placeholder="Mobile number" className="flex-1 h-8 text-xs" />
              </div>
            </form>
            {suppliers.length > 0 ? (
              <div className="space-y-1">
                {suppliers.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-1 px-2 rounded bg-zinc-50 text-xs">
                    <div>
                      <span className="font-medium">{s.name}</span>
                      {s.contact && <span className="text-zinc-500 ml-2">Agent: {s.contact}</span>}
                      {s.phone && <span className="text-zinc-400 ml-2">{s.phone}</span>}
                    </div>
                    <EditSupplierButton id={s.id} name={s.name} contact={s.contact} phone={s.phone} />
                    <DeleteSupplierButton id={s.id} name={s.name} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400">No suppliers yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark size={16} className="text-emerald-600" />
              Bank Accounts ({bankAccounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addBankAccount} className="flex flex-col gap-2 mb-3">
              <div className="flex gap-2">
                <input
                  list="ba-bank-list"
                  name="bank"
                  required
                  placeholder="Bank"
                  className="flex h-9 flex-1 rounded-lg border border-zinc-200 bg-white px-2 text-sm"
                />
                <datalist id="ba-bank-list">
                  {[...new Set(bankAccounts.map((b) => b.bank))].map((b) => (
                    <option key={b} value={b} />
                  ))}
                  <option value="BDO" /><option value="BPI" /><option value="Metrobank" />
                  <option value="Landbank" /><option value="PNB" /><option value="Security Bank" />
                  <option value="UnionBank" /><option value="RCBC" /><option value="EastWest" />
                </datalist>
                <Button type="submit" size="sm" className="h-9 shrink-0">
                  <Plus size={14} className="mr-1" /> Add
                </Button>
              </div>
              <div className="flex gap-2">
                <Input name="accountName" required placeholder="Account name" className="flex-1 h-9 text-sm" />
                <Input name="accountNumber" required placeholder="Account no." className="flex-1 h-9 text-sm" />
              </div>
            </form>
            {bankAccounts.length > 0 ? (
              <div className="space-y-1">
                {bankAccounts.map((ba) => (
                  <div key={ba.id} className="flex items-center justify-between py-1 px-2 rounded bg-zinc-50 text-xs">
                    <div>
                      <span className="font-medium">{ba.bank}</span>
                      <span className="text-zinc-500 ml-2">{ba.accountName}</span>
                      <span className="text-zinc-400 ml-1 font-mono">{ba.accountNumber}</span>
                    </div>
                    <DeleteBankAccountButton id={ba.id} bank={ba.bank} accountNumber={ba.accountNumber} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400">No bank accounts yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard size={16} className="text-emerald-600" />
            All Cheques
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cheques.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">No cheques issued yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-zinc-500 text-xs">
                    <th className="text-left py-2 pr-2 font-medium">Cheque No.</th>
                    <th className="text-left py-2 px-2 font-medium">Payee</th>
                    <th className="text-right py-2 px-2 font-medium">Amount</th>
                    <th className="text-left py-2 px-2 font-medium">Bank</th>
                    <th className="text-left py-2 px-2 font-medium">Issued</th>
                    <th className="text-left py-2 px-2 font-medium">Cleared</th>
                    <th className="text-center py-2 px-2 font-medium">Status</th>
                    <th className="text-left py-2 px-2 font-medium">Notes</th>
                    <th className="text-right py-2 pl-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cheques.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 pr-2 font-mono text-xs">{c.chequeNo}</td>
                      <td className="py-2 px-2">{c.payee}</td>
                      <td className="py-2 px-2 text-right font-medium">{formatCurrency(c.amount)}</td>
                      <td className="py-2 px-2 text-xs">{c.bank}</td>
                      <td className="py-2 px-2 text-xs">{formatDate(c.issueDate)}</td>
                      <td className="py-2 px-2 text-xs">{c.clearDate ? formatDate(c.clearDate) : "—"}</td>
                      <td className="py-2 px-2 text-center">
                        <Badge variant={
                          c.status === "cleared" ? "success" :
                          c.status === "bounced" ? "destructive" :
                          c.status === "cancelled" ? "destructive" : "warning"
                        }>
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-xs text-zinc-500 max-w-40 truncate">{c.notes || c.voucherNo || "—"}</td>
                      <td className="py-2 pl-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {c.status === "issued" && (
                            <>
                              <form action={async () => { "use server"; await updateChequeStatus(c.id, "cleared") }}>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" title="Mark Cleared">
                                  <Check size={14} />
                                </Button>
                              </form>
                              <form action={async () => { "use server"; await updateChequeStatus(c.id, "bounced") }}>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" title="Mark Bounced">
                                  <X size={14} />
                                </Button>
                              </form>
                            </>
                          )}
                          {c.status !== "cleared" && (
                            <form action={async () => { "use server"; await deleteCheque(c.id) }}>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" title="Delete">
                                <Trash2 size={12} />
                              </Button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
