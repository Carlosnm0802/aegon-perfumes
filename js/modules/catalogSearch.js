/**
 * Escapa los comodines de ILIKE para que se comparen como texto literal.
 * @param {string} term - término de búsqueda introducido por el usuario
 * @returns {string} término con los comodines escapados
 */
function escapeLikeWildcards(term) {
  return String(term).replace(/[%_]/g, match => `\\${match}`);
}

/**
 * Escapa la sintaxis estructural de un filtro de PostgREST embebido a mano.
 * @param {string} term - valor que se interpolará dentro de un filtro
 * @returns {string} valor con comas y paréntesis codificados
 */
function escapeFilterSyntax(term) {
  const reserved = { ',': '%2C', '(': '%28', ')': '%29' };
  return String(term).replace(/[,()]/g, match => reserved[match]);
}

/**
 * Busca y filtra productos según texto y filtros activos.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - cliente ya inicializado
 * @param {Object} filtros - { busqueda, categoria, marcas, genero, tipo, precioMin, precioMax }
 * @param {Object} [opciones] - { incluirStock: boolean, pagina: number, porPagina: number }
 * @returns {Promise<Array>} lista de productos que cumplen los filtros
 */
export async function searchProducts(supabase, filtros, opciones = {}) {
  const { incluirStock = false, pagina = 0, porPagina = 12 } = opciones;
  const variantColumns = incluirStock
    ? 'id, size_label, price, discount_percentage, available, type, stock'
    : 'id, size_label, price, discount_percentage, available, type';

  let query = supabase
    .from('products')
    .select(`
      id, name, image_url, is_active,
      brand:brands!inner(name, slug),
      category:categories!inner(name, slug),
      variants!inner(${variantColumns})
    `)
    .order('created_at', { ascending: false });

  if (filtros.categoria) {
    query = query.eq('category.slug', filtros.categoria);
  }
  if (filtros.marcas?.length > 0) {
    query = query.in('brand.slug', filtros.marcas);
  }
  if (filtros.genero) {
    query = query.eq('gender', filtros.genero);
  }
  if (filtros.tipo) {
    query = query.eq('variants.type', filtros.tipo);
  }
  if (filtros.precioMin !== undefined && filtros.precioMin !== null) {
    query = query.gte('variants.price', filtros.precioMin);
  }
  if (filtros.precioMax !== undefined && filtros.precioMax !== null) {
    query = query.lte('variants.price', filtros.precioMax);
  }

  if (filtros.busqueda) {
    const terminoSeguro = escapeLikeWildcards(filtros.busqueda);
    const patronBusqueda = `%${terminoSeguro}%`;
    const { data: marcasCoincidentes, error } = await supabase
      .from('brands')
      .select('id')
      .ilike('name', patronBusqueda);

    if (error) {
      console.error('Error buscando marcas coincidentes:', error);
      query = query.ilike('name', patronBusqueda);
    } else {
      const idsMarcas = (marcasCoincidentes ?? []).map(marca => marca.id);
      const patronParaOr = escapeFilterSyntax(patronBusqueda);
      query = idsMarcas.length > 0
        ? query.or(`name.ilike.${patronParaOr},brand_id.in.(${idsMarcas.join(',')})`)
        : query.ilike('name', patronBusqueda);
    }
  }

  const desde = pagina * porPagina;
  const hasta = desde + porPagina - 1;
  const { data, error } = await query.range(desde, hasta);

  if (error) throw error;
  return data ?? [];
}