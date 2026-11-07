export type Book = { id: number; title: string; author: string; isbn: string; categoryId: number; category: string; publicationYear: number; totalCopies: number; availableCopies: number; archived: boolean }
export type Category = { id: number; name: string }
export type Borrower = { id: number; name: string; email: string; phone: string; registeredAt: string }
export type Loan = { id: number; bookId: number; title: string; borrowerId: number; borrowerName: string; issuedAt: string; dueAt: string; returnedAt: string | null; isOverdue: boolean; overdueDays: number }
export type Page<T> = { items: T[]; total: number; pageNumber: number; pageSize: number }
export type Report = { titles: number; totalBooks: number; availableBooks: number; borrowedBooks: number; overdueBooks: number; borrowers: number; categories: { name: string; total: number; available: number }[]; monthly: { month: string; loans: number }[]; recent: Loan[]; overdue: Loan[] }

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } })
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}))
    throw new Error(problem.errors ? Object.values(problem.errors).flat().join(' ') : problem.title || 'Request failed. Please try again.')
  }
  return response.status === 204 ? undefined as T : response.json()
}
export const json = (method: string, data?: unknown): RequestInit => ({ method, body: data === undefined ? undefined : JSON.stringify(data) })
export const date = (value: string) => new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value))
