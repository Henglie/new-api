package model

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLegacyDisplayInCurrencyKeepsConfiguredCurrency(t *testing.T) {
	generalSetting := operation_setting.GetGeneralSetting()
	originalType := generalSetting.QuotaDisplayType
	originalMap := common.OptionMap
	t.Cleanup(func() {
		generalSetting.QuotaDisplayType = originalType
		common.OptionMap = originalMap
	})

	tests := []struct {
		name    string
		current string
		value   string
		want    string
	}{
		{name: "CNY stays CNY when legacy toggle is true", current: operation_setting.QuotaDisplayTypeCNY, value: "true", want: operation_setting.QuotaDisplayTypeCNY},
		{name: "CUSTOM stays CUSTOM when legacy toggle is true", current: operation_setting.QuotaDisplayTypeCustom, value: "true", want: operation_setting.QuotaDisplayTypeCustom},
		{name: "USD stays USD when legacy toggle is true", current: operation_setting.QuotaDisplayTypeUSD, value: "true", want: operation_setting.QuotaDisplayTypeUSD},
		{name: "TOKENS falls back to USD when legacy toggle is true", current: operation_setting.QuotaDisplayTypeTokens, value: "true", want: operation_setting.QuotaDisplayTypeUSD},
		{name: "CNY switches to TOKENS when legacy toggle is false", current: operation_setting.QuotaDisplayTypeCNY, value: "false", want: operation_setting.QuotaDisplayTypeTokens},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			common.OptionMap = map[string]string{}
			generalSetting.QuotaDisplayType = tt.current

			require.NoError(t, updateOptionMap("DisplayInCurrencyEnabled", tt.value))

			assert.Equal(t, tt.want, operation_setting.GetQuotaDisplayType())
		})
	}
}
