import { useNavigation } from '@react-navigation/native';
import { JSX } from 'react';
import { ScrollView } from 'react-native';
import { toolType } from '../types/tools-type';
import CardTopic from './CardTopic';
import Grid from './Grid';

type MapToolsProps = {
  tools: toolType[];
};

/**
 * Renders a scrollable grid of tool cards for map-related actions.
 *
 * @param tools - An array of tool objects, each containing a `name`, `icon`, and `screen` property.
 *   - If the tool's `screen` is `'ComingSoon'`, the card navigates to the "ComingSoon" screen with the tool's name and icon as parameters.
 *   - Otherwise, the card navigates to the specified screen.
 *
 * @returns A JSX element containing a scrollable grid of tool cards.
 */
export default function MapTools({ tools }: MapToolsProps): JSX.Element {
  const navigation = useNavigation<any>();

  return (
    <ScrollView>
      <Grid>
        {tools.map(tool => {
          if (tool.screen === 'ComingSoon') {
            return (
              <CardTopic
                key={tool.id}
                title={tool.name}
                icon={tool.icon}
                onPress={() =>
                  navigation.navigate('ComingSoon', {
                    title: tool.name,
                    icon: tool.icon,
                  })
                }
              />
            );
          }

          return (
            <CardTopic
              key={tool.id}
              title={tool.name}
              icon={tool.icon}
              onPress={() => navigation.navigate(tool.screen)}
            />
          );
        })}
      </Grid>
    </ScrollView>
  );
}
