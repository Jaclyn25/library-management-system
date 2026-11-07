import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Search, Pencil, Archive } from 'lucide-react'
import { api, json } from './api'
import type { Book, Category, Page } from './api'
import { Dialog, Empty, ErrorBox, Field, Loading, Pager } from './components'

export const bookSchema = z.object({ title: z.string().trim().min(1, 'Enter a title.').max(200), author: z.string().trim().min(1, 'Enter an author.').max(160), isbn: z.string().regex(/^(\d{10}|\d{13})$/, 'Use 10 or 13 digits.'), categoryId: z.number().min(1, 'Choose a category.'), publicationYear: z.number().int().min(1450).max(new Date().getFullYear() + 1), totalCopies: z.number().int().min(1).max(100000) })
type BookValues = z.infer<typeof bookSchema>

export function BookForm({ book, categories, saved, cancel }: { book?: Book; categories: Category[]; saved: () => void; cancel: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<BookValues>({ resolver: zodResolver(bookSchema), defaultValues: book ?? { title: '', author: '', isbn: '', categoryId: 0, publicationYear: new Date().getFullYear(), totalCopies: 1 } })
  const mutation = useMutation({ mutationFn: (values: BookValues) => api(`/books${book ? `/${book.id}` : ''}`, json(book ? 'PUT' : 'POST', values)), onSuccess: saved })
  return <form onSubmit={handleSubmit(v => mutation.mutate(v))} noValidate><ErrorBox error={mutation.error}/><div className="form-grid">
    <Field label="Title" error={errors.title?.message}><input autoFocus {...register('title')}/></Field>
    <Field label="Author" error={errors.author?.message}><input {...register('author')}/></Field>
    <Field label="ISBN" error={errors.isbn?.message}><input inputMode="numeric" {...register('isbn')}/></Field>
    <Field label="Category" error={errors.categoryId?.message}><select {...register('categoryId', { valueAsNumber: true })}><option value={0}>Choose category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
    <Field label="Publication year" error={errors.publicationYear?.message}><input type="number" {...register('publicationYear', { valueAsNumber: true })}/></Field>
    <Field label="Total copies" error={errors.totalCopies?.message}><input type="number" {...register('totalCopies', { valueAsNumber: true })}/></Field>
  </div><footer className="form-actions"><button type="button" className="secondary" onClick={cancel}>Cancel</button><button disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Save book'}</button></footer></form>
}

export function Catalog({ notify }: { notify: (text: string) => void }) {
  const client = useQueryClient()
  const [search, setSearch] = useState(''), [category, setCategory] = useState(''), [availability, setAvailability] = useState(''), [page, setPage] = useState(1)
  const [editor, setEditor] = useState<Book | 'new' | null>(null), [archive, setArchive] = useState<Book | null>(null), [detail, setDetail] = useState<Book | null>(null)
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api<Category[]>('/categories') })
  const books = useQuery({ queryKey: ['books', search, category, availability, page], queryFn: () => api<Page<Book>>(`/books?${new URLSearchParams({ search, ...(category && { categoryId: category }), ...(availability && { available: availability }), page: String(page) })}`) })
  const refresh = () => { void client.invalidateQueries(); setEditor(null); setArchive(null) }
  const remove = useMutation({ mutationFn: (id: number) => api(`/books/${id}`, json('DELETE')), onSuccess: () => { refresh(); notify('Book archived. Its history is preserved.') } })
  return <><div className="page-heading"><div><p className="eyebrow">COLLECTION</p><h1>Book catalog</h1><p>Every title, every copy, in one place.</p></div><button onClick={() => setEditor('new')}><Plus size={17}/>Add book</button></div>
    <div className="toolbar"><label className="search"><Search size={18}/><input aria-label="Search books" placeholder="Search title, author or ISBN" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}/></label><select aria-label="Filter category" value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}><option value="">All categories</option>{categories.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><select aria-label="Filter availability" value={availability} onChange={e => { setAvailability(e.target.value); setPage(1) }}><option value="">All availability</option><option value="true">Available</option><option value="false">On loan</option></select></div>
    <ErrorBox error={books.error || categories.error}/>{books.isPending ? <Loading/> : !books.data?.items.length ? <Empty title="No books found"><p>Add your first title or adjust the filters.</p></Empty> : <section className="table-panel"><div className="table-scroll"><table><thead><tr><th>Book / author</th><th>Category</th><th>ISBN</th><th>Availability</th><th>Actions</th></tr></thead><tbody>{books.data.items.map((b, i) => <tr key={b.id}><td><div className="book-cell"><span className={`book-spine tone-${i % 4}`}>{b.title.slice(0, 1)}</span><div><button className="text-button title-link" onClick={() => setDetail(b)}>{b.title}</button><small>{b.author}</small></div></div></td><td>{b.category}</td><td className="mono">{b.isbn}</td><td><span className={`badge ${b.availableCopies ? 'success' : 'warning'}`}>{b.availableCopies} of {b.totalCopies} available</span></td><td><div className="row-actions"><button className="icon-button" aria-label={`Edit ${b.title}`} onClick={() => setEditor(b)}><Pencil size={16}/></button><button className="icon-button" aria-label={`Archive ${b.title}`} onClick={() => { remove.reset(); setArchive(b) }}><Archive size={16}/></button></div></td></tr>)}</tbody></table></div><Pager page={page} total={books.data.total} change={setPage}/></section>}
    {editor && <Dialog title={editor === 'new' ? 'Add a book' : 'Edit book'} close={() => setEditor(null)}><BookForm book={editor === 'new' ? undefined : editor} categories={categories.data ?? []} cancel={() => setEditor(null)} saved={() => { refresh(); notify('Book saved successfully.') }}/></Dialog>}
    {archive && <Dialog title="Archive this book?" close={() => setArchive(null)}><p>“{archive.title}” will leave the active catalog. Borrowing history stays available. All copies must be returned first.</p><ErrorBox error={remove.error}/><footer className="form-actions"><button className="secondary" onClick={() => setArchive(null)}>Cancel</button><button disabled={remove.isPending} onClick={() => remove.mutate(archive.id)}>Archive book</button></footer></Dialog>}
    {detail && <Dialog title={detail.title} close={() => setDetail(null)}><dl className="details"><dt>Author</dt><dd>{detail.author}</dd><dt>ISBN</dt><dd>{detail.isbn}</dd><dt>Category</dt><dd>{detail.category}</dd><dt>Published</dt><dd>{detail.publicationYear}</dd><dt>Copies</dt><dd>{detail.availableCopies} available / {detail.totalCopies} total</dd></dl></Dialog>}
  </>
}
