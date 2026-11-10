/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, it } from 'vitest'

import type { DifferencesMap, PricingSyncModels } from '../../types'
import type { PricingSourceSelections } from '../upstream-ratio-sync-helpers'
import { UpstreamRatioSyncTable } from '../upstream-ratio-sync-table'

const differences: DifferencesMap = {}

function buildPrices(count: number): PricingSyncModels {
  return Object.fromEntries(
    Array.from({ length: count }, (_, index) => {
      const model = `m${String(index).padStart(2, '0')}`
      return [
        model,
        {
          current: { model_ratio: 1, billing_mode: 'ratio' },
          upstreams: { upstream: { model_ratio: 2, billing_mode: 'ratio' } },
        },
      ]
    })
  )
}

function TableFixture(props: { prices: PricingSyncModels }) {
  const [selectedSources, setSelectedSources] =
    useState<PricingSourceSelections>({})
  return (
    <UpstreamRatioSyncTable
      prices={props.prices}
      differences={differences}
      selectedSources={selectedSources}
      isDisabled={false}
      isSyncing={false}
      onSelectPrices={(selections) =>
        setSelectedSources((previous) => ({
          ...previous,
          ...Object.fromEntries(
            selections.map((selection) => [selection.model, selection.source])
          ),
        }))
      }
      onUnselectPrices={(models) =>
        setSelectedSources((previous) =>
          Object.fromEntries(
            Object.entries(previous).filter(
              ([model]) => !models.includes(model)
            )
          )
        )
      }
    />
  )
}

it('keeps the current page when a model from a later page is selected', async () => {
  const user = userEvent.setup()
  render(<TableFixture prices={buildPrices(25)} />)

  await user.click(screen.getByRole('button', { name: 'Go to next page' }))
  expect(screen.getByText('m10')).toBeVisible()
  expect(screen.queryByText('m00')).not.toBeInTheDocument()

  await user.click(
    screen.getByRole('checkbox', {
      name: 'Select price for m10 from upstream',
    })
  )

  expect(
    screen.getByRole('checkbox', {
      name: 'Select price for m10 from upstream',
    })
  ).toBeChecked()
  expect(screen.getByText('m10')).toBeVisible()
  expect(screen.queryByText('m00')).not.toBeInTheDocument()
})

it('falls back to the last available page when the rows shrink', async () => {
  const user = userEvent.setup()
  const { rerender } = render(<TableFixture prices={buildPrices(11)} />)

  await user.click(screen.getByRole('button', { name: 'Go to next page' }))
  expect(screen.getByText('m10')).toBeVisible()

  rerender(<TableFixture prices={buildPrices(5)} />)

  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Go to previous page' })
    ).toBeDisabled()
  )
  expect(screen.getByText('m00')).toBeVisible()
  expect(screen.getByText('m04')).toBeVisible()
})
