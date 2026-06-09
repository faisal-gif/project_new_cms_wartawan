import React from 'react'
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from './ui/sidebar'
import { Link } from '@inertiajs/react'
import { GalleryVerticalEnd, LayoutDashboard, Newspaper } from 'lucide-react';
import ApplicationLogo from './ApplicationLogo';

function AppSidebar() {

    const { state } = useSidebar();

    const isActive = (names) => {
        if (Array.isArray(names)) {
            return names.some(name => route().current(name));
        }
        return route().current(names);
    };

    return (
        <Sidebar collapsible='icon'>
            <SidebarHeader style={{ backgroundColor: "#343a40" }} className="text-gray-100">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg"
                            className="hover:bg-transparent hover:text-gray-100 active:bg-transparent focus:bg-transparent"
                            asChild
                        >

                            <Link href="/">
                                <div className="flex flex-col gap-0.5 leading-none items-center justify-center w-full">
                                    {/* 3. Render kondisional berdasarkan state sidebar */}
                                    {state === "collapsed" ? (
                                        <img src="/favicon.ico" alt="icon" className='w-6 h-6' />
                                    ) : (
                                        <ApplicationLogo className="w-64" />
                                    )}
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent style={{ backgroundColor: "#343a40" }} className="text-gray-100">

                <SidebarGroup>
                    <SidebarGroupLabel className="text-gray-400 uppercase tracking-wider text-[12px]  py-4">
                        Menu
                    </SidebarGroupLabel>

                    <SidebarGroupContent className="space-y-1">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isActive(['dashboard'])}>
                                    <Link href={route('dashboard')} >
                                        <LayoutDashboard className="w-4 h-4" />
                                        Dashboard
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isActive(['news.*'])}>
                                    <Link href={route('news.index')} >
                                        <Newspaper className="w-4 h-4" />
                                        News
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                           <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isActive(['daerah.news.index'])}>
                                    <Link href={route('daerah.news.index')} >
                                        <Newspaper className="w-4 h-4" />
                                        News Daerah
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>

    )
}

export default AppSidebar