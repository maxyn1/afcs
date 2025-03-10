
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, MessageSquare, Phone, Mail } from "lucide-react";

const Support = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <HelpCircle size={24} />
              Help & Support
            </CardTitle>
            <CardDescription>
              Get help with using the Kenya AFCS payment system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <Phone className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-medium">Call Support</h3>
                  <p className="text-sm text-gray-500 mt-1">Available 8am-6pm</p>
                  <Button variant="link" className="mt-2">+254 700 123 456</Button>
                </CardContent>
              </Card>
              
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <MessageSquare className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-medium">Live Chat</h3>
                  <p className="text-sm text-gray-500 mt-1">Chat with our team</p>
                  <Button variant="link" className="mt-2">Start Chat</Button>
                </CardContent>
              </Card>
              
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <Mail className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-medium">Email Support</h3>
                  <p className="text-sm text-gray-500 mt-1">Get help via email</p>
                  <Button variant="link" className="mt-2">support@kenyaafcs.co.ke</Button>
                </CardContent>
              </Card>
            </div>
            
            <h3 className="text-lg font-medium mb-4">Frequently Asked Questions</h3>
            <Accordion type="single" collapsible className="mb-6">
              <AccordionItem value="item-1">
                <AccordionTrigger>How do I top up my wallet?</AccordionTrigger>
                <AccordionContent>
                  To top up your wallet, go to the Dashboard and find the "Top Up Wallet" section. Enter the amount you wish to add and click "Top Up via M-PESA". Follow the prompts on your phone to complete the transaction.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger>How do I pay for a ride?</AccordionTrigger>
                <AccordionContent>
                  To pay for a ride, select the SACCO and vehicle first, then choose your route from the available options. Click the "Pay Now" button next to your selected route. The fare will be deducted from your wallet balance.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger>What happens if I don't have enough balance?</AccordionTrigger>
                <AccordionContent>
                  If you don't have enough balance in your wallet to pay for a ride, you'll need to top up your wallet first. The system will prompt you to add funds if your balance is insufficient for the selected route.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger>How do I view my transaction history?</AccordionTrigger>
                <AccordionContent>
                  You can view your complete transaction history by navigating to the Transaction History page. This shows all your past payments and wallet top-ups.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger>Is my payment information secure?</AccordionTrigger>
                <AccordionContent>
                  Yes, all payment information is securely processed. We use industry-standard encryption and security protocols to protect your payment details and personal information.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <h3 className="text-lg font-medium mb-4">Contact Us</h3>
            <Card>
              <CardContent className="p-4">
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">Your Name</label>
                      <Input id="name" placeholder="Enter your name" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                      <Input id="email" type="email" placeholder="Enter your email" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                    <Input id="subject" placeholder="How can we help you?" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">Message</label>
                    <Textarea id="message" placeholder="Describe your issue or question" rows={4} />
                  </div>
                  <Button type="submit" className="w-full">Submit</Button>
                </form>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Support;
