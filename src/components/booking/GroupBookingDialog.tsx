
"use client";

import React, { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Room, TimeSlot, GroupMember } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Trash2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const groupMemberSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
});

const bookingFormSchema = z.object({
  groupMembers: z.array(groupMemberSchema),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the Terms & Conditions.",
  }),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface GroupBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room;
  slot: TimeSlot;
  userEmail: string;
  onConfirmBooking: (roomId: string, slotId: string, groupMembers: GroupMember[], agreedToTerms: boolean) => void;
}

const TERMS_AND_CONDITIONS = `
By booking this room, you agree to the following:
1. The room must be used for academic discussion or collaborative work.
2. Maintain cleanliness and order in the room.
3. Do not exceed the stated room capacity (${"{roomCapacity}"}). The primary booker is counted towards capacity.
4. Vacate the room promptly at the end of your booked slot.
5. Any damage to university property will be your responsibility.
6. DiscussZone is not responsible for lost or stolen items.
7. Ensure all group members adhere to university policies.
`;

export function GroupBookingDialog({ open, onOpenChange, room, slot, userEmail, onConfirmBooking }: GroupBookingDialogProps) {
  const { toast } = useToast();
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      groupMembers: [],
      agreeToTerms: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "groupMembers",
  });

  const watchGroupMembers = form.watch("groupMembers");
  const currentGroupSize = 1 + (watchGroupMembers?.length || 0); // Booker + added members
  const remainingCapacity = room.capacity - currentGroupSize;

  useEffect(() => {
    // Reset form when dialog opens or room/slot changes
    if (open) {
      form.reset({
        groupMembers: [],
        agreeToTerms: false,
      });
    }
  }, [open, room, slot, form]);

  const onSubmit = (data: BookingFormValues) => {
    if (currentGroupSize > room.capacity) {
      toast({
        title: "Capacity Exceeded",
        description: `Maximum capacity of ${room.capacity} for this room. Your group has ${currentGroupSize} members.`,
        variant: "destructive",
      });
      return;
    }
    onConfirmBooking(room.id, slot.id, data.groupMembers, data.agreeToTerms);
  };

  const handleAddMember = () => {
    if (currentGroupSize < room.capacity) {
      append({ name: '', email: '' });
    } else {
      toast({
        title: "Capacity Reached",
        description: `Cannot add more members. Room capacity is ${room.capacity}.`,
        variant: "warning",
      });
    }
  };
  
  const formattedTerms = TERMS_AND_CONDITIONS.replace("{roomCapacity}", room.capacity.toString());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Book {room.name} - {slot.startTime} to {slot.endTime}</DialogTitle>
          <DialogDescription>
            Room Capacity: {room.capacity} seats. Confirm details for your booking.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-grow overflow-hidden flex flex-col">
            <ScrollArea className="flex-grow pr-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 text-lg">Terms & Conditions</h3>
                  <ScrollArea className="h-32 border rounded-md p-3 text-sm bg-muted/30">
                    <pre className="whitespace-pre-wrap font-sans">{formattedTerms}</pre>
                  </ScrollArea>
                  <FormField
                    control={form.control}
                    name="agreeToTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 mt-2 shadow-sm">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer">
                            I agree to the Terms & Conditions.
                          </FormLabel>
                           <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">Group Members (Optional)</h3>
                    <Button type="button" size="sm" variant="outline" onClick={handleAddMember} disabled={remainingCapacity <= 0}>
                      <UserPlus className="mr-2 h-4 w-4" /> Add Member
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    You ({userEmail}) are the primary booker. Add other members if booking for a group.
                    Current group size: {currentGroupSize} / {room.capacity}. Remaining spots: {remainingCapacity}.
                  </p>
                  
                  {fields.length > 0 && (
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 border rounded-md p-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-start p-2 border rounded-md bg-background">
                        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name={`groupMembers.${index}.name`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Member {index + 1} Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Full Name" {...f} />
                                </FormControl>
                                <FormMessage className="text-xs"/>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`groupMembers.${index}.email`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Member {index + 1} Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="member@example.com" {...f} />
                                </FormControl>
                                <FormMessage className="text-xs"/>
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="mt-6">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    </div>
                  )}
                   {fields.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No additional group members added.</p>}
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={!form.watch('agreeToTerms') || remainingCapacity < 0}>
                Confirm Booking
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
