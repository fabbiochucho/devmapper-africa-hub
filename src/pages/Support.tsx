
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, MessageSquare, Phone, Mail, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const Support = () => {
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    description: '',
    priority: 'medium'
  });

  const faqs = [
    {
      question: "How do I submit a development project report?",
      answer: "Navigate to the 'Submit Report' page, fill out the project details including location, SDG alignment, and supporting documentation. Your report will be reviewed by our verification team.",
      category: "Reporting"
    },
    {
      question: "How is data verified on the platform?",
      answer: "We use a multi-tier verification system including community validation, expert review, and cross-referencing with official sources. Verified reports receive a verification badge.",
      category: "Verification"
    },
    {
      question: "Can I edit or update my submitted reports?",
      answer: "Yes, you can update your reports through the Analytics page. Select your report and use the 'Update Progress' option to add new information or corrections.",
      category: "Reporting"
    },
    {
      question: "What are the different user roles and permissions?",
      answer: "We have Citizens, NGO Members, Government Officials, Company Representatives, and Platform Admins. Each role has different verification requirements and access levels.",
      category: "Accounts"
    }
  ];

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Support ticket submitted:', ticketForm);
    // Here you would typically send the ticket to a support system
    alert('Support ticket submitted successfully! We\'ll get back to you within 24 hours.');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Support Center</h1>
        <p className="text-muted-foreground">
          Get help with DevMapper and find answers to common questions
        </p>
      </div>

      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
          <TabsTrigger value="status">System Status</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="grid gap-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                    <Badge variant="outline">{faq.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Submit a Support Ticket</CardTitle>
                <CardDescription>Get personalized help from our support team</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <Input
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, category: e.target.value }))}
                      required
                    >
                      <option value="">Select category</option>
                      <option value="technical">Technical Issue</option>
                      <option value="account">Account Problem</option>
                      <option value="reporting">Reporting Issue</option>
                      <option value="verification">Verification Question</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed description of your issue or question"
                      rows={4}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">Submit Ticket</Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">General inquiries and support</p>
                  <p className="font-medium">support@devmapper.africa</p>
                  <p className="text-sm text-muted-foreground">Response time: 24-48 hours</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Community Forum
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">Get help from the community</p>
                  <Button variant="outline" className="w-full">Visit Forum</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Office Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Monday - Friday: 9:00 AM - 6:00 PM (GMT)</p>
                  <p className="text-sm">Saturday: 10:00 AM - 2:00 PM (GMT)</p>
                  <p className="text-sm">Sunday: Closed</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">System Status</h2>
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  All Systems Operational
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Map Services</span>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Report Submission</span>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>User Authentication</span>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Analytics Dashboard</span>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Support;
