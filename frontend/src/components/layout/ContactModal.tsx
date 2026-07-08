import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ErrorAlert } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useSendContactMessage } from "@/hooks/useContact";
import { getErrorMessage } from "@/api/axiosClient";

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Modale de contact : envoie réellement un e-mail vers contact.subserver@proton.me
 * via POST /contact (backend FastAPI + SMTP, cf. app/core/email_service.py). */
export function ContactModal({ open, onOpenChange }: ContactModalProps) {
  const { user } = useAuth();
  const sendMessage = useSendContactMessage();
  const [name, setName] = React.useState(user?.first_name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");

  const canSubmit = !!name.trim() && !!email.trim() && !!subject.trim() && !!message.trim();

  function resetForm() {
    setName(user?.first_name ?? "");
    setEmail(user?.email ?? "");
    setSubject("");
    setMessage("");
    sendMessage.reset();
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    sendMessage.mutate(
      { name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() },
      {
        onSuccess: () => {
          toast.success("Message envoyé ! Nous te répondrons rapidement.");
          resetForm();
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nous contacter</DialogTitle>
          <DialogDescription>
            Nous serons ravis de répondre à tes questions ou suggestions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {sendMessage.isError && (
            <ErrorAlert message={getErrorMessage(sendMessage.error, "Impossible d'envoyer le message.")} compact />
          )}

          <div>
            <Label htmlFor="contact-name">Nom</Label>
            <Input
              id="contact-name"
              placeholder="Ton nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="ton@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="contact-subject">Sujet</Label>
            <Input
              id="contact-subject"
              placeholder="Objet de ton message"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
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
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={sendMessage.isPending} disabled={!canSubmit}>
              Envoyer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
