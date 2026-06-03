import AppSidebar from '@/Components/AppSidebar';

import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Button } from '@/Components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { SidebarProvider, SidebarTrigger } from '@/Components/ui/sidebar';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user ;
    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-muted/30">
                <AppSidebar />

                <div className="flex-1 flex flex-col min-w-0">
                    <header className="h-14 flex items-center justify-between border-b bg-background px-4 sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <SidebarTrigger />
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="flex items-center gap-3">
                                    <div className="text-right hidden sm:block">
                                        <div className="text-sm font-medium leading-none">{user.name}</div>
                                        <div className="text-xs text-muted-foreground">{user.email}</div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback className="bg-[#343a40] text-white text-sm">AR</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {/* <DropdownMenuItem asChild>
                                    <Link href="/profile">Profile</Link>
                                </DropdownMenuItem> */}
                                <DropdownMenuItem asChild className={"w-full"}>
                                    <Link href="/logout" method="post" as="button">
                                        Log Out
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                    </header>

                    <main className="flex-1 p-6">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>

    );
}
