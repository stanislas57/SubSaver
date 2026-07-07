import { useMutation } from "@tanstack/react-query";
import { contactService } from "@/services/contactService";
import type { ContactFormPayload } from "@/types";

export function useSendContactMessage() {
  return useMutation({
    mutationFn: (payload: ContactFormPayload) => contactService.send(payload),
  });
}
