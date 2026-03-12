"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../../components/auth-provider"
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui"
import { PlayCircle, Clock, CheckCircle } from "lucide-react"

interface Template {
  id: number
  name: string
  subject: string
}

interface Contact {
  id: number
  name: string
  email: string
}

interface Campaign {
  id: number
  name: string
  subject: string
  status: string
  createdAt: string
  sentAt: string | null
}

export default function CampaignsPage() {
  const { token } = useAuth()
  const [templates, setTemplates] = useState<Template[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [selectedContacts, setSelectedContacts] = useState<number[]>([])
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [token])

  const fetchData = async () => {
    try {
      const hdrs = { "Authorization": `Bearer ${token}` }
      const [tplRes, ctcRes, cmpRes] = await Promise.all([
        fetch("http://localhost:4000/templates", { headers: hdrs }),
        fetch("http://localhost:4000/contacts", { headers: hdrs }),
        fetch("http://localhost:4000/campaigns", { headers: hdrs })
      ])
      
      if (tplRes.ok) setTemplates(await tplRes.json())
      if (ctcRes.ok) setContacts(await ctcRes.json())
      if (cmpRes.ok) setCampaigns(await cmpRes.json())
    } catch (err) {
      console.error("Failed to fetch campaign data:", err)
    }
  }

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("http://localhost:4000/campaigns/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          subject,
          templateId: parseInt(templateId),
          contactIds: selectedContacts
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to send campaign")
      }

      // Reset form and refresh list
      setName("")
      setSubject("")
      setTemplateId("")
      setSelectedContacts([])
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleContact = (id: number) => {
    setSelectedContacts(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handleTemplateChange = (val: string) => {
    setTemplateId(val)
    const tpl = templates.find(t => t.id === parseInt(val))
    if (tpl && !subject) setSubject(tpl.subject)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Email Campaigns</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
            <CardDescription>Configure and send an email broadcast.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSendCampaign}>
            <CardContent className="space-y-4">
              {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>}
              
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer Newsletter" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template">Email Template</Label>
                <Select value={templateId} onValueChange={handleTemplateChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input id="subject" required value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Recipients ({selectedContacts.length} selected)</Label>
                <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                  {contacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No contacts found.</p>
                  ) : (
                    contacts.map(contact => (
                      <div key={contact.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`contact-${contact.id}`}
                          checked={selectedContacts.includes(contact.id)}
                          onChange={() => toggleContact(contact.id)}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={`contact-${contact.id}`} className="text-sm font-medium leading-none">
                          {contact.name} <span className="text-muted-foreground">({contact.email})</span>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading || selectedContacts.length === 0 || !templateId}>
                <PlayCircle className="mr-2 h-4 w-4" />
                {isLoading ? "Sending..." : "Send Campaign Now"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
            <CardDescription>Track the status of your broadcasts.</CardDescription>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
                No campaigns sent yet.
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{campaign.name}</h4>
                      <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center space-x-1">
                        {campaign.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-sm font-medium capitalize">{campaign.status}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
