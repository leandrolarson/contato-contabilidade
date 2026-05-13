import Alpine from "https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js";

import EditorJS from "https://esm.sh/@editorjs/editorjs";
import Header from "https://esm.sh/@editorjs/header";
import EditorjsList from "https://esm.sh/@editorjs/list";
import ImageTool from "https://esm.sh/@editorjs/image";

import { supabase } from "./supabase.js";

window.Alpine = Alpine;

document.addEventListener("alpine:init", () => {
  Alpine.data("painelEditor", () => {
    // 💡 O SEGREDO ESTÁ AQUI:
    // Guardamos a instância fora do objeto reativo do Alpine!
    let editor = null;

    return {
      titulo: "",
      resumo: "",
      mensagem: "",
      carregando: false,
      artigoId: null,

      async init() {
        // 1. Verificação de Segurança
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          window.location.href = "login.html";
          return;
        }

        await this.$nextTick();

        const params = new URLSearchParams(window.location.search);
        const artigoId = params.get("id");

        this.artigoId = artigoId;

        // 2. Inicialização do Editor.js (Usamos 'editor' e não 'this.editor')
        editor = new EditorJS({
          holder: "editorjs",
          placeholder: "Comece a escrever o seu artigo aqui...",
          tools: {
            header: {
              class: Header,
            },
            list: {
              class: EditorjsList,
              inlineToolbar: true,
              config: {
                defaultStyle: "unordered",
              },
            },

            image: {
              class: ImageTool,
              config: {
                uploader: {
                  async uploadByFile(file) {
                    const fileExt = file.name.split(".").pop();
                    const fileName = `${Date.now()}.${fileExt}`;
                    const filePath = `artigos/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                      .from("blog-imagens")
                      .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data } = supabase.storage
                      .from("blog-imagens")
                      .getPublicUrl(filePath);

                    return {
                      success: 1,
                      file: { url: data.publicUrl },
                    };
                  },
                },
              },
            },
          },
        });

        await editor.isReady;

        if (artigoId) {
          const { data, error } = await supabase
            .from("artigos")
            .select("*")
            .eq("id", artigoId)
            .single();

          if (data) {
            this.titulo = data.titulo;
            this.resumo = data.resumo;

            await editor.render(data.conteudo);
          }
        }
      },

      async guardarArtigo() {
        if (!this.titulo) {
          alert("O título é obrigatório!");
          return;
        }

        this.carregando = true;
        try {
          // Usamos a variável isolada 'editor'
          const conteudoJson = await editor.save();

          const slug = this.titulo
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w ]+/g, "")
            .replace(/ +/g, "-");

          // Encontra a 1ª imagem para a capa (com navegação segura '?')
          const imagemCapa =
            conteudoJson.blocks.find((b) => b.type === "image")?.data?.file
              ?.url || "";

          const payload = {
            titulo: this.titulo,
            resumo: this.resumo,
            conteudo: conteudoJson,
            slug: slug,
            imagem_capa: imagemCapa,
          };

          let error;

          if (this.artigoId) {
            ({ error } = await supabase
              .from("artigos")
              .update(payload)
              .eq("id", this.artigoId));
          } else {
            ({ error } = await supabase.from("artigos").insert([payload]));
          }

          if (error) throw error;

          this.mensagem = "✅ Artigo publicado com sucesso!";

          setTimeout(() => {
            this.mensagem = "";

            if (!this.artigoId) {
              this.titulo = "";
              this.resumo = "";
              editor.clear();
            }
          }, 3000);
        } catch (err) {
          console.error(err);
          alert("Erro ao publicar: " + err.message);
        } finally {
          this.carregando = false;
        }
      },

      async fazerLogout() {
        await supabase.auth.signOut();
        window.location.href = "login.html";
      },
    };
  });
});

Alpine.start();
