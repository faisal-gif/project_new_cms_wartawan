import React from 'react';
import { Editor } from '@tinymce/tinymce-react';
import EditorImageModal from './EditorImageModal';

export default function InputEditor({
    value,
    onChange,
    height = 800, // Prop baru untuk mengatur tinggi editor 
    enableImageUpload = true // Prop baru, default ON
}) {
    // Susun toolbar secara dinamis berdasarkan prop
    const toolbarConfig =
        'bold italic | ' +
        'numlist bullist | ' +
        (enableImageUpload ? 'customImage ' : '') + 'media link |' +
        'table | ';

    return (
        <>
            <Editor
                // 1. GUNAKAN API KEY (Daftar di tiny.cloud untuk dapat gratis)
                // Atau kosongkan jika ingin pakai mode warning/self-hosted
                tinymceScriptSrc="/vendor/tinymce/tinymce.min.js"
                referrerPolicy='origin'

                // 2. Binding Data
                value={value}
                onEditorChange={(content, editor) => {
                    onChange(content);
                }}

                // 3. Konfigurasi Fitur Lengkap
                init={{
                    license_key: 'gpl',
                    min_height: 300,
                    max_height: height,
                    mobile: {
                        max_height: 450,
                        toolbar_mode: 'wrap',
                    },
                    menubar: false,
                    toolbar_mode: 'wrap',
                    forced_root_block: 'p',
                    noneditable_class: 'instagram-media',
                    extended_valid_elements: '+script[language|type|src]',
                    file_picker_types: 'image',
                    contextmenu: false,

                    setup: (editor) => {
                        // Daftarkan custom button hanya jika fitur aktif
                        if (enableImageUpload) {
                            editor.ui.registry.addButton('customImage', {
                                icon: 'image',
                                tooltip: 'Upload gambar',
                                onAction: () => {
                                    window.dispatchEvent(
                                        new CustomEvent('open-editor-image-modal', {
                                            detail: { editor }
                                        })
                                    );
                                }
                            });
                        }
                    },

                    image_dimensions: false,
                    image_default_style: 'width:100%;height:500px;',
                    plugins: [
                        'searchreplace', 'lists', 'advlist', 'link', 'image',
                        'charmap', 'preview', 'anchor', 'pagebreak', 'nonbreaking',
                        'visualblocks', 'visualchars', 'code', 'fullscreen', 'code',
                        'insertdatetime', 'media', 'table', 'emoticons', 'help',
                        'wordcount', 'directionality'
                    ],
                    valid_elements: '*[*]',   // izinkan semua dulu
                    invalid_elements: 'span,o:p', // lalu larang span

                    // Gunakan variabel toolbar yang sudah dibuat dinamis
                    toolbar: toolbarConfig,

                    style_formats: [
                        { title: 'Bold', inline: 'strong' },
                        { title: 'Italic', inline: 'em' },
                        { title: 'Underline', inline: 'u' },
                        { title: 'Strikethrough', inline: 'strike' }
                    ],
                    image_title: true,
                    image_advtab: false,
                    automatic_uploads: false,
                    branding: false,
                    promotion: false,
                    paste_data_images: false,   // blok paste gambar (Ctrl+V)
                    images_upload_handler: null,
                    images_file_types: "",      // opsional: blok semua tipe
                    block_unsupported_drop: true, // 🔴 ini kunci utama

                    // 🟢 PRE-PROCESS: perbaiki HTML mentah SEBELUM di-parse browser.
                    // Samsung Notes menghasilkan tag rusak <span;> / </span;> (ada titik-koma),
                    // yang menyebabkan karakter ">" liar bocor jadi teks biasa.
                    // Harus dibersihkan di sini karena paste_postprocess bekerja di level
                    // DOM yang sudah terparsing (sudah terlambat menangkap tag cacat).
                    paste_preprocess: (plugin, args) => {
                        args.content = args.content
                            // Perbaiki tag span rusak menjadi span valid
                            .replace(/<\s*span\s*;\s*>/gi, '<span>')
                            .replace(/<\s*\/\s*span\s*;\s*>/gi, '</span>')
                            // Buang komentar clipdata Samsung Notes
                            .replace(/<!--[\s\S]*?-->/g, '')
                            // Jaring pengaman: buang varian tag rusak lain (mis. <p;>, <b;>, <i;>)
                            .replace(/<(\/?)\s*([a-z0-9]+)\s*;\s*>/gi, '<$1$2>');
                    },

                    // 💡 FILTERING SUPER KETAT: Semua jadi <p>, amankan list, hapus foto
                    paste_postprocess: (plugin, args) => {
                        args.node.querySelectorAll("img").forEach(el => el.remove());
                        args.node.querySelectorAll("span").forEach(el => {
                            el.replaceWith(...el.childNodes);
                        });
                        args.node.querySelectorAll("o\\:p").forEach(el => el.remove());

                        const blockTags = ["div", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "section", "article", "address"];
                        blockTags.forEach(tag => {
                            args.node.querySelectorAll(tag).forEach(el => {
                                if (el.closest('li')) {
                                    el.replaceWith(...el.childNodes);
                                } else {
                                    const p = document.createElement("p");
                                    p.innerHTML = el.innerHTML;
                                    el.replaceWith(p);
                                }
                            });
                        });

                        // Bersihkan semua inline style & class sisa
                        args.node.querySelectorAll("*").forEach(el => {
                            el.removeAttribute("class");
                            el.style.fontFamily = "";
                            el.style.fontSize = "";
                            el.style.lineHeight = "";
                            if (el.tagName !== 'A') {
                                el.removeAttribute("href");
                            }
                        });
                    },

                    content_style: 'body { font-size:14px } img { max-width:100%; height:auto; }',
                }}
            />

            {/* Hanya render modal jika upload image diizinkan */}
            {enableImageUpload && <EditorImageModal />}
        </>
    );
}