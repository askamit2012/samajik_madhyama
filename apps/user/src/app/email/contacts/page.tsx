"use client"

import { useState, useEffect } from "react"
import { Button } from "@repo/ui"

type Contact = {
  id: number
  name: string
  email: string
  tags: string | null
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [tags, setTags] = useState("")

  useEffect(() => {
    fetch("http://localhost:4000/contacts")
      .then((res) => res.json())
      .then((data) => setContacts(data))
      .catch((err) => console.error(err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("http://localhost:4000/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, tags }),
      })
      if (res.ok) {
        const newContact = await res.json()
        setContacts([...contacts, newContact])
        setName("")
        setEmail("")
        setTags("")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:4000/contacts/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setContacts(contacts.filter((c) => c.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Manage Contacts</h1>

      <form onSubmit={handleSubmit} className="mb-8 p-6 bg-card rounded-lg shadow-sm border border-border">
        <h2 className="text-xl font-semibold mb-4">Add New Contact</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="p-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button type="submit">Add Contact</Button>
      </form>

      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Tags</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  No contacts found.
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr key={contact.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                  <td className="p-4">{contact.name}</td>
                  <td className="p-4">{contact.email}</td>
                  <td className="p-4">
                    {contact.tags?.split(",").map((tag) => (
                      <span key={tag} className="inline-block bg-primary/10 text-primary text-xs px-2 py-1 rounded-full mr-2">
                        {tag.trim()}
                      </span>
                    ))}
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(contact.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
