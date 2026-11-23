import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getDb } from '../db/database';
import { usePalette } from '../theme/palette';

export function StudyScreen(){
 const colors = usePalette();
 const [counts,setCounts]=useState({highlights:0,notes:0,bookmarks:0});
 useEffect(()=>{(async()=>{const db=await getDb(); const h=await db.getFirstAsync<{c:number}>('SELECT COUNT(*) c FROM highlights'); const n=await db.getFirstAsync<{c:number}>('SELECT COUNT(*) c FROM notes'); const b=await db.getFirstAsync<{c:number}>('SELECT COUNT(*) c FROM bookmarks'); setCounts({highlights:h?.c??0,notes:n?.c??0,bookmarks:b?.c??0});})().catch(console.error)},[]);
 return <ScrollView style={[styles.container,{backgroundColor:colors.bg}]} contentContainerStyle={styles.content}><Text style={[styles.heading,{color:colors.text}]}>Meu Estudo</Text><View style={[styles.card,{backgroundColor:colors.surface,borderColor:colors.border}]}><Text style={[styles.title,{color:colors.accent}]}>Destaques</Text><Text style={[styles.num,{color:colors.text}]}>{counts.highlights}</Text></View><View style={[styles.card,{backgroundColor:colors.surface,borderColor:colors.border}]}><Text style={[styles.title,{color:colors.accent}]}>Salvos</Text><Text style={[styles.num,{color:colors.text}]}>{counts.bookmarks}</Text></View><View style={[styles.card,{backgroundColor:colors.surface,borderColor:colors.border}]}><Text style={[styles.title,{color:colors.accent}]}>Notas</Text><Text style={[styles.num,{color:colors.text}]}>{counts.notes}</Text></View><Text style={[styles.hint,{color:colors.muted}]}>Categorias iniciais: Fé, Família, Queda, Restauração, Missão e Bênção.</Text></ScrollView>
}
const styles=StyleSheet.create({container:{flex:1,backgroundColor:'#031f2b'},content:{padding:18},heading:{color:'#eaf8ff',fontSize:28,fontWeight:'800',marginBottom:12},card:{backgroundColor:'#073040',borderRadius:16,borderColor:'#164657',borderWidth:1,padding:18,marginBottom:12,flexDirection:'row',justifyContent:'space-between'},title:{color:'#76dcff',fontSize:18,fontWeight:'700'},num:{color:'#fff',fontSize:22,fontWeight:'800'},hint:{color:'#7fa6b5',lineHeight:22,marginTop:8}});
