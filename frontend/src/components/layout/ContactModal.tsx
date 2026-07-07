import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Modale de contact : email + message. Soumet via mailto: ou stub EmailJS/Resend
 * une fois le backend SMTP configuré. Pour l'instant, utilise mailto: + copie
 * système pour fonctionner sans serveur. */
export function ContactModal({ open, onOpenChange }: ContactModalProps) {
  const { user } = useAuth();
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;

    setSubmitting(true);

    // Pour l'instant : mailto: simple. Une fois EmailJS/Resend/backend configuré,
    // remplacer par un vrai appel API.
    const subject = "Contact SubServer";
    const body = `Email: ${email}\n\n${message}`;
    const mailtoLink = `mailto:contact.subserver@proton.me?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Ouvre le client mail par défaut
    window.location.href = mailtoLink;

    // Réinitialise et ferme après un délai
    setTimeout(() => {
      setEmail(user?.email ?? "");
      setMessage("");
      onOpenChange(false);
      setSubmitting(false);
    }, 500);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nous contacter</DialogTitle>
          <DialogDescription>
            Nous serons ravis de répondre à vos questions ou suggestions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="contact-message">Message</Label>
            <Textarea
              id="contact-message"
              placeholder="Dites-nous en plus…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={submitting} disabled={!email.trim() || !message.trim()}>
              Envoyer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
