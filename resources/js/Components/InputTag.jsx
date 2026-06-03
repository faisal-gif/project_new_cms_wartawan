import { useState } from "react";
import { XIcon, GripVertical } from "lucide-react";

import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";

import {
    SortableContext,
    rectSortingStrategy, // Menggunakan rectSortingStrategy untuk layout flex wrap
    arrayMove,
    useSortable
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

// Komponen shadcn/ui
import { Label } from "@/Components/ui/label";
import { Badge } from "@/Components/ui/badge";
import { cn } from "@/lib/utils"; // Pastikan path utils sesuai dengan proyek Anda

function TagItem({ id, text, onRemove, onEdit }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(text);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    // SAVE EDIT
    const saveEdit = () => {
        const newVal = editValue.trim();

        if (newVal && newVal !== text) {
            onEdit(text, newVal);
        }

        setIsEditing(false);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "inline-flex", // inline-flex agar tetap rapi berjejer ke samping
                isDragging && "opacity-50 relative z-10"
            )}
        >
            <Badge
                variant="secondary"
                className="flex items-center gap-1.5 px-2 py-1 text-sm transition-colors font-normal"
            >
                {/* DRAG HANDLE */}
                {!isEditing && (
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                    >
                        <GripVertical className="w-3.5 h-3.5" />
                    </div>
                )}

                {/* EDIT MODE */}
                {isEditing ? (
                    <input
                        autoFocus
                        value={editValue}
                        className="bg-transparent text-foreground outline-none w-20 min-w-[80px]"
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") setIsEditing(false);
                        }}
                    />
                ) : (
                    <span
                        onDoubleClick={() => setIsEditing(true)}
                        className="cursor-text"
                    >
                        {text}
                    </span>
                )}

                {/* DELETE */}
                <button
                    type="button"
                    onClick={() => onRemove(text)}
                    className="ml-1 rounded-full p-0.5 hover:bg-destructive hover:text-destructive-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                    <XIcon className="w-3.5 h-3.5" />
                </button>
            </Badge>
        </div>
    );
}

export default function InputTag({ label = "Tags", value = [], onChange }) {
    const [tagInput, setTagInput] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    );

    // REORDER
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            const oldIndex = value.indexOf(active.id);
            const newIndex = value.indexOf(over.id);

            onChange(arrayMove(value, oldIndex, newIndex));
        }
    };

    // INPUT CHANGE (ADD WHEN COMMA)
    const handleTagInputChange = (e) => {
        const val = e.target.value;

        if (val.endsWith(",")) {
            const newTag = val.slice(0, -1).trim();

            if (newTag && !value.includes(newTag)) {
                onChange([...value, newTag]);
            }
            setTagInput("");
        } else {
            setTagInput(val);
        }
    };

    // ENTER & DELETE KEY
    const handleTagKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const newTag = tagInput.trim();

            if (newTag && !value.includes(newTag)) {
                onChange([...value, newTag]);
            }

            setTagInput("");
        }

        if (e.key === "Backspace" && tagInput === "" && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    // DELETE TAG
    const removeTag = (tag) => {
        onChange(value.filter((t) => t !== tag));
    };

    // EDIT TAG
    const editTag = (oldTag, newTag) => {
        if (value.includes(newTag)) return;

        const updated = value.map((t) => (t === oldTag ? newTag : t));
        onChange(updated);
    };

    return (
        <div className="space-y-2 w-full">
            <Label>{label}</Label>

            {/* Container ini dirancang agar mirip persis dengan komponen <Input /> shadcn */}
            <div className="flex min-h-10 w-full flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={value}
                        strategy={rectSortingStrategy}
                    >
                        {value.map((tag) => (
                            <TagItem
                                key={tag}
                                id={tag}
                                text={tag}
                                onRemove={removeTag}
                                onEdit={editTag}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                <input
                    type="text"
                    className="flex-1 min-w-[150px] bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder={value.length === 0 ? "Tulis tag lalu koma…" : ""}
                    value={tagInput}
                    onChange={handleTagInputChange}
                    onKeyDown={handleTagKeyDown}
                />
            </div>
        </div>
    );
}