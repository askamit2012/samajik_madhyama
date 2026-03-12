import Link from "next/link"
import { Button } from "@repo/ui"

export default function EmailDashboardPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Email Marketing Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Manage your contacts and create beautiful email templates for your marketing campaigns.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-card rounded-lg border border-border shadow-sm flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
          <h2 className="text-2xl font-semibold">Contacts</h2>
          <p className="text-muted-foreground flex-grow">
            View, add, and manage your subscriber lists. Add tags to segment your audience for targeted campaigns.
          </p>
          <Link href="/email/contacts" passHref legacyBehavior>
            <Button asChild>
              <a>Manage Contacts</a>
            </Button>
          </Link>
        </div>

        <div className="p-6 bg-card rounded-lg border border-border shadow-sm flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
          <h2 className="text-2xl font-semibold">Templates</h2>
          <p className="text-muted-foreground flex-grow">
            Create and edit responsive HTML email templates using our rich text editor.
          </p>
          <Link href="/email/templates" passHref legacyBehavior>
            <Button asChild variant="secondary">
              <a>Manage Templates</a>
            </Button>
          </Link>
        </div>

        <div className="p-6 bg-card rounded-lg border border-border shadow-sm flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
          <h2 className="text-2xl font-semibold">Campaigns</h2>
          <p className="text-muted-foreground flex-grow">
            Send bulk emails to your contacts using your custom templates and track sending statuses.
          </p>
          <Link href="/email/campaigns" passHref legacyBehavior>
            <Button asChild variant="default">
              <a>Send Campaigns</a>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
