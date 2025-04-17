import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import driverService, { Message, Conversation } from "@/services/driverService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, Search, User, UserCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DriverMessages = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ["driverConversations"],
    queryFn: driverService.getConversations,
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["conversationMessages", selectedConversation?.id],
    queryFn: () => selectedConversation ? driverService.getMessages(selectedConversation.id) : Promise.resolve([]),
    enabled: !!selectedConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: number; content: string }) => 
      driverService.sendMessage(conversationId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversationMessages", selectedConversation?.id] });
      setNewMessage("");
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to send",
        description: "Your message couldn't be sent. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !newMessage.trim()) return;
    
    sendMessageMutation.mutate({ 
      conversationId: selectedConversation.id, 
      content: newMessage 
    });
  };

  const filteredConversations = conversations.filter(
    convo => convo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatConversationDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Messages</h1>
      
      <Card className="h-[75vh] overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 h-full">
          {/* Conversations List */}
          <div className="border-r">
            <CardHeader className="py-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="all">
                <TabsList className="grid grid-cols-2 mx-2">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                </TabsList>
                
                <ScrollArea className="h-[calc(75vh-115px)]">
                  <TabsContent value="all" className="m-0">
                    {loadingConversations ? (
                      <div className="space-y-2 p-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-muted/50 rounded-full animate-pulse"></div>
                            <div className="space-y-2 flex-1">
                              <div className="h-4 bg-muted/50 rounded animate-pulse w-24"></div>
                              <div className="h-3 bg-muted/50 rounded animate-pulse w-40"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : filteredConversations.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        No conversations found
                      </div>
                    ) : (
                      <div>
                        {filteredConversations.map((conversation) => (
                          <div key={conversation.id}>
                            <button
                              className={`w-full text-left p-3 hover:bg-muted/50 flex items-start space-x-3 transition-colors ${
                                selectedConversation?.id === conversation.id ? "bg-muted/50" : ""
                              }`}
                              onClick={() => setSelectedConversation(conversation)}
                            >
                              <Avatar>
                                <AvatarImage src={conversation.avatar} />
                                <AvatarFallback>
                                  {conversation.is_group ? <Users size={18} /> : <User size={18} />}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-start">
                                  <span className="font-medium truncate">
                                    {conversation.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatConversationDate(conversation.last_message_date)}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {conversation.last_message}
                                </p>
                                {conversation.unread_count > 0 && (
                                  <Badge variant="default" className="mt-1">
                                    {conversation.unread_count} new
                                  </Badge>
                                )}
                              </div>
                            </button>
                            <Separator />
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="unread" className="m-0">
                    {filteredConversations.filter(c => c.unread_count > 0).length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        No unread messages
                      </div>
                    ) : (
                      <div>
                        {filteredConversations
                          .filter(c => c.unread_count > 0)
                          .map((conversation) => (
                            <div key={conversation.id}>
                              <button
                                className={`w-full text-left p-3 hover:bg-muted/50 flex items-start space-x-3 transition-colors ${
                                  selectedConversation?.id === conversation.id ? "bg-muted/50" : ""
                                }`}
                                onClick={() => setSelectedConversation(conversation)}
                              >
                                <Avatar>
                                  <AvatarImage src={conversation.avatar} />
                                  <AvatarFallback>
                                    {conversation.is_group ? <Users size={18} /> : <User size={18} />}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                  <div className="flex justify-between items-start">
                                    <span className="font-medium truncate">
                                      {conversation.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatConversationDate(conversation.last_message_date)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {conversation.last_message}
                                  </p>
                                  <Badge variant="default" className="mt-1">
                                    {conversation.unread_count} new
                                  </Badge>
                                </div>
                              </button>
                              <Separator />
                            </div>
                          ))}
                      </div>
                    )}
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </div>
          
          {/* Messages Area */}
          <div className="md:col-span-2 flex flex-col h-full">
            {selectedConversation ? (
              <>
                <CardHeader className="py-3 border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={selectedConversation.avatar} />
                      <AvatarFallback>
                        {selectedConversation.is_group ? <Users size={18} /> : <UserCircle size={18} />}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedConversation.name}</CardTitle>
                      <CardDescription>
                        {selectedConversation.is_group 
                          ? `${selectedConversation.member_count} members` 
                          : selectedConversation.status === 'online' 
                            ? 'Online' 
                            : 'Offline'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                          <div className={`h-12 ${i % 2 === 0 ? 'w-32 bg-primary/20' : 'w-40 bg-muted/50'} rounded animate-pulse`}></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={`flex ${message.is_mine ? 'justify-end' : ''}`}
                        >
                          <div 
                            className={`max-w-[75%] rounded-lg px-3 py-2 ${
                              message.is_mine 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}
                          >
                            {!message.is_mine && !selectedConversation.is_group && (
                              <div className="flex items-center gap-2 mb-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={selectedConversation.avatar} />
                                  <AvatarFallback>
                                    <UserCircle size={16} />
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium">{selectedConversation.name}</span>
                              </div>
                            )}
                            {selectedConversation.is_group && !message.is_mine && (
                              <div className="mb-1">
                                <span className="text-xs font-medium">{message.sender_name}</span>
                              </div>
                            )}
                            <p>{message.content}</p>
                            <div className={`text-xs text-right mt-1 ${message.is_mine ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                              {formatMessageTime(message.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                
                <CardFooter className="border-t p-3">
                  <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim() || sendMessageMutation.isPending}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </CardFooter>
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center p-4">
                  <UserCircle className="h-16 w-16 mx-auto text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DriverMessages;