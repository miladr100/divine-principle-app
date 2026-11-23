import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Reader: { sectionId: string; previousSectionId?: string };
};

export type TabParamList = {
  Início: undefined;
  Índice: undefined;
  Pesquisa: undefined;
  'Meu Estudo': undefined;
  Ajustes: undefined;
};
