import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { InventoryItem } from "@/lib/types";
import { useCreateTransaction } from "@/hooks/useInventory";

// Form schema with validation
const formSchema = z.object({
  quantity: z.number({
    required_error: "Quantity is required",
    invalid_type_error: "Quantity must be a number",
  }).positive("Quantity must be greater than 0"),
  itemId: z.number({
    required_error: "Item type is required",
    invalid_type_error: "Please select an item type",
  }),
  transactionType: z.enum(["depleting", "restocking"], {
    required_error: "Transaction type is required",
  }),
  notes: z.string().optional(),
  userName: z.string().default("System"),
});

interface InventoryFormProps {
  inventoryItems: InventoryItem[];
  onSuccess: () => void;
  isLoading: boolean;
}

export default function InventoryForm({ inventoryItems, onSuccess, isLoading }: InventoryFormProps) {
  const createTransaction = useCreateTransaction();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: undefined,
      itemId: undefined,
      transactionType: "depleting",
      notes: "",
      userName: "System",
    },
  });
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await createTransaction.mutateAsync(values);
      form.reset({
        quantity: undefined,
        itemId: undefined,
        transactionType: "depleting",
        notes: "",
        userName: "System",
      });
      onSuccess();
    } catch (error) {
      console.error("Error submitting form", error);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-lg font-semibold text-[#4F772D] border-b border-gray-200 pb-3 mb-4">
        <svg className="inline-block w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New Inventory Transaction
      </h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter quantity" 
                    {...field} 
                    onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                    disabled={isLoading || createTransaction.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="itemId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Type</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value?.toString()}
                  disabled={isLoading || createTransaction.isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {inventoryItems.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="transactionType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Transaction Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4"
                    disabled={isLoading || createTransaction.isPending}
                  >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="depleting" />
                      </FormControl>
                      <FormLabel className="font-normal">Depleting</FormLabel>
                    </FormItem>
                    
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="restocking" />
                      </FormControl>
                      <FormLabel className="font-normal">Restocking</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Add any additional details" 
                    className="resize-none"
                    disabled={isLoading || createTransaction.isPending}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button
            type="submit"
            className="w-full bg-[#4F772D] hover:bg-[#31572C] text-white"
            disabled={isLoading || createTransaction.isPending}
          >
            {createTransaction.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <svg className="inline-block w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Record Transaction
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
