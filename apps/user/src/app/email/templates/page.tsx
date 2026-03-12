"use client"

import { useState, useEffect } from "react"
import { Button } from "@repo/ui"

type Template = {
  id: number
  name: string
  subject: string
  htmlContent: string
  plainText: string | null
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [htmlContent, setHtmlContent] = useState("")
  const [plainText, setPlainText] = useState("")

  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    fetch("http://localhost:4000/templates")
      .then((res) => res.json())
      .then((data) => setTemplates(data))
      .catch((err) => console.error(err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        // Update
        const res = await fetch(`http://localhost:4000/templates/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, subject, htmlContent, plainText }),
        })
        if (res.ok) {
          const updated = await res.json()
          setTemplates(templates.map((t) => (t.id === editingId ? updated : t)))
          resetForm()
        }
      } else {
        // Create
        const res = await fetch("http://localhost:4000/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, subject, htmlContent, plainText }),
        })
        if (res.ok) {
          const newTemplate = await res.json()
          setTemplates([...templates, newTemplate])
          resetForm()
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:4000/templates/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setTemplates(templates.filter((t) => t.id !== id))
        if (editingId === id) resetForm()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleEdit = (t: Template) => {
    setEditingId(t.id)
    setName(t.name)
    setSubject(t.subject)
    setHtmlContent(t.htmlContent)
    setPlainText(t.plainText || "")
  }

  const resetForm = () => {
    setEditingId(null)
    setName("")
    setSubject("")
    setHtmlContent("")
    setPlainText("")
  }

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
      {/* Sidebar: List */}
      <div className="w-full md:w-1/3 border-r border-border pr-6">
        <h1 className="text-3xl font-bold mb-6">Templates</h1>

        <div className="flex flex-col gap-4">
          <Button variant="secondary" onClick={resetForm} className="w-full justify-start">
            + Create New Template
          </Button>

          {templates.map((t) => (
            <div
              key={t.id}
              className={`p-4 rounded-lg cursor-pointer transition-colors border ${
                editingId === t.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/50"
              }`}
            >
              <h3 className="font-semibold">{t.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{t.subject}</p>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => handleEdit(t)}>
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(t.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No templates saved yet.</p>
          )}
        </div>
      </div>

      {/* Main Area: Editor */}
      <div className="w-full md:w-2/3">
        <h2 className="text-2xl font-semibold mb-6">
          {editingId ? "Edit Template" : "New Template"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Internal Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="p-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Email Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="p-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <label className="text-sm font-medium">HTML Content (Rich Text Editor coming soon)</label>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              className="p-3 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm min-h-[250px]"
              placeholder="<h1>Hello {{name}},</h1><p>Check out our latest news!</p>"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-muted-foreground">Plain Text Fallback (Optional)</label>
            <textarea
              value={plainText}
              onChange={(e) => setPlainText(e.target.value)}
              className="p-3 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
              placeholder="Hello {{name}}, Check out our latest news!"
            />
          </div>

          <div className="flex gap-4 mt-4">
            <Button type="submit" size="lg">
              {editingId ? "Save Changes" : "Create Template"}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
