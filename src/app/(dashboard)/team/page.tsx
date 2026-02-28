
"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { UserPlus, Shield, Mail, Phone, MoreVertical } from "lucide-react"

export default function TeamPage() {
  const db = useFirestore()
  const { user } = useUser()

  const staffQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "staff_profiles"), orderBy("name", "asc"))
  }, [db, user])

  const { data: team, isLoading } = useCollection(staffQuery)

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-headline font-bold text-white mb-2">Equipe de Elite</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Gestão de Membros e Permissões RGMJ</p>
        </div>
        <Button className="gold-gradient text-background font-bold gap-2">
          <UserPlus className="h-4 w-4" /> Convidar Membro
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center text-muted-foreground glass rounded-xl">
            Sincronizando equipe...
          </div>
        ) : team && team.length > 0 ? (
          team.map((member) => (
            <Card key={member.id} className="glass border-primary/10 hover-gold transition-all group overflow-hidden">
              <div className="h-2 bg-primary/20 group-hover:bg-primary transition-all" />
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarImage src={`https://picsum.photos/seed/${member.id}/200`} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/20 text-primary bg-primary/5">
                    {member.role}
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{member.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" /> {member.email}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-primary/5">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><Phone className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><Shield className="h-4 w-4" /></Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><MoreVertical className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-muted-foreground glass rounded-xl">
            Nenhum membro registrado no sistema.
          </div>
        )}
      </div>
    </div>
  )
}
